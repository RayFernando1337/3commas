2025-08-07 — Goated Master Plan Progress Update

### Summary

- Implemented the M0 slice of the plan: swipe logging with Convex persistence, idempotent GitHub review posting, and a reliable mock-data flow to exercise the UI in preview environments.

### Major changes

- Convex schema (`convex/schema.ts`)

  - Added tables and indexes:
    - `swipeSessions` • index: `by_userId`
    - `swipes` • indexes: `by_userId`, `by_repository_and_number`, `by_userId_repository_and_number`
    - `githubSettings` • index: `by_userId`
    - `mockIssues` • index: `by_repository_and_number`

- Convex functions

  - `convex/swipes.ts`
    - `log` (internalMutation): Insert swipe with 1h dedupe by `userId/repository/number/decision`.
    - `listRecent` (query): List recent swipes for a user.
    - `logPublic` (mutation): Same as `log`, but resolves user from Clerk identity; used by server route.
  - `convex/swipeSessions.ts`
    - `start` (mutation), `end` (mutation), `getActive` (query).
  - `convex/githubSettings.ts`
    - `get` (query), `set` (mutation) with typed `filters`.
  - `convex/mockIssues.ts`
    - `list` (query): Returns mock issues/PRs for UI.
    - `clear` (mutation): Clears mock data.
    - `seed` (mutation): Seeds N mock rows.

- Next.js API routes

  - New `app/api/github/swipe/route.ts`
    - Authenticates via Clerk; sets Convex auth token from Clerk template `"convex"`.
    - Calls `api.swipes.logPublic` to persist the swipe.
    - If item is a PR and the swipe was newly logged, posts a review to GitHub.
    - Returns `{ logged: boolean, postedReview: boolean }`.
  - Updated `app/api/github/issues/route.ts`
    - Supports `?mock=1` to return from Convex `api.mockIssues.list`.
    - Keeps existing GitHub search behavior for live data.

- UI updates
  - `app/dashboard/issue-review/page.tsx`
    - Swiping now calls `POST /api/github/swipe` (logs + optional review) instead of calling `/api/github/review` directly.
    - Decision mapping:
      - PR: right → APPROVE, left → REQUEST_CHANGES
      - Issue: right → ACK, left → NEEDS_DISCUSSION
    - Added a “Use mock data” switch to force loading from Convex.
    - Added error handling with an option to “Load mock data” on failure.
    - Added `Refresh` button to re-trigger data load without full reload.

### Behavior and reliability

- Idempotency: PR review is posted only if a new swipe was logged (1h dedupe window suppresses repeats).
- Auth: Dashboard and API routes are protected by Clerk middleware; Convex auth token is set in server route before mutations.
- Mock flow: When live data is empty or on demand, UI loads `?mock=1` from Convex.

### Environments and seeding

- Convex generated types refreshed (`npx convex codegen`).
- Dev deployment seeded with 25 mock items via Convex MCP using `mockIssues.seed`.
  - Dev deployment URL: `https://elated-axolotl-170.convex.cloud`.

### How to verify quickly

- Toggle “Use mock data” on `/dashboard/issue-review` and swipe through items.
- For PRs, confirm server logs `postedReview: true` on new decisions; for duplicates within 1h it stays `false`.

### Notes / prerequisites

- Ensure `NEXT_PUBLIC_CONVEX_URL` and `GITHUB_TOKEN` are configured.
- Clerk JWT template named `convex` should be present so server route can set Convex auth.

### Next steps (M1 targets)

- Wire `githubSettings` filters to UI and apply them in `/api/github/issues` for live data.
- Add a history panel using `swipes.listRecent`.
