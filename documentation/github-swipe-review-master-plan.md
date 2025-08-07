## GitHub Swipe Reviewer – Master Implementation Plan

### Purpose and Outcome

- Build a production-grade, swipe-based GitHub issue/PR reviewer into this template.
- Deliver a robust architecture with persistence (Convex), secure GitHub integrations, resilient error handling, observability, and tests.
- Provide step-by-step tasks that another engineer or a language model can execute sequentially.

### Tech Stack and Constraints

- Next.js App Router (15.x), React 19, Clerk for auth, Tailwind 4, Tabler Icons.
- Convex 1.x for data, auth context, actions, queries/mutations, and scheduling.
- GitHub REST (initial) with option to adopt GraphQL for better pagination later.
- Secrets and tokens server-only. No secrets in client bundles.

### Current State Summary (as of this plan)

- UI:
  - `app/dashboard/issue-review/page.tsx`: Swipe deck, posts PR reviews via server routes, shows progress and basic states.
  - `app/dashboard/app-sidebar.tsx`, `app/dashboard/site-header.tsx`, `app/dashboard/layout.tsx`: Navigation and page frame wiring.
- Server routes:
  - `app/api/github/issues/route.ts`: Fetches blended issues/PRs feed with a `GITHUB_TOKEN`.
  - `app/api/github/review/route.ts`: Submits PR reviews (APPROVE/REQUEST_CHANGES).
- Auth:
  - `middleware.ts`: Protects `/dashboard` and `/api/*` with Clerk.
- Convex:
  - `convex/schema.ts`: Defines `users` (Clerk externalId), `paymentAttempts`.
  - `convex/http.ts`: Clerk webhook ingestion into Convex (`users.upsertFromClerk`, `users.deleteFromClerk`, `paymentAttempts.savePaymentAttempt`).

### Environment and Configuration

- Required env vars:
  - `GITHUB_TOKEN`: PAT or GitHub App token with `repo:read` and `pull_request:write` scope (M0). Move to per-user OAuth or GitHub App later.
  - `NEXT_PUBLIC_CLERK_FRONTEND_API_URL`: Clerk frontend API URL.
  - `CLERK_WEBHOOK_SECRET`: For Clerk webhooks handled by `convex/http.ts`.
- Local dev: add to `.env.local`. Ensure these are not exposed to the client except `NEXT_PUBLIC_*`.

---

## Phase M0 — Hardened MVP

### Goals

- Persist swipe actions and sessions in Convex.
- Idempotency for review actions and durable audit logs.
- Minimal settings persisted in Convex; start wiring filters.
- Keep Next.js routes for GitHub API calls, but centralize recording state in Convex.
- Basic test coverage; robust error handling and UX.

### Schema (Convex) — Additions

Edit `convex/schema.ts` to add tables and indexes. Follow index naming rules: include all fields and use `by_field1_and_field2` naming.

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ...existing tables

  swipeSessions: defineTable({
    userId: v.id("users"),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    totalCount: v.number(),
  }).index("by_userId", ["userId"]),

  swipes: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("swipeSessions")),
    itemId: v.string(), // GitHub node id or "owner/repo#number"
    repository: v.string(),
    number: v.number(),
    isPullRequest: v.boolean(),
    decision: v.union(
      v.literal("APPROVE"),
      v.literal("REQUEST_CHANGES"),
      v.literal("ACK"),
      v.literal("NEEDS_DISCUSSION")
    ),
    note: v.optional(v.string()),
    createdAt: v.number(),
    dedupeKey: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_repository_and_number", ["repository", "number"])
    .index("by_dedupeKey", ["dedupeKey"]),

  githubSettings: defineTable({
    userId: v.id("users"),
    filters: v.optional(
      v.object({
        onlyAssigned: v.optional(v.boolean()),
        onlyReviewRequested: v.optional(v.boolean()),
        labelsInclude: v.optional(v.array(v.string())),
        reposInclude: v.optional(v.array(v.string())),
        reposExclude: v.optional(v.array(v.string())),
      })
    ),
  }).index("by_userId", ["userId"]),

  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    kind: v.string(),
    metadata: v.object({}).loose(),
    createdAt: v.number(),
  }).index("by_userId_and_createdAt", ["userId", "createdAt"]),
});
```

### Convex Functions — New Modules

Implement using the new function syntax with explicit `args` and `returns`. Use `ctx.auth.getUserIdentity()` to resolve the current user and map to `users` via `externalId`.

1. `convex/settings.ts`

```ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

export const get = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      onlyAssigned: v.optional(v.boolean()),
      onlyReviewRequested: v.optional(v.boolean()),
      labelsInclude: v.optional(v.array(v.string())),
      reposInclude: v.optional(v.array(v.string())),
      reposExclude: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const row = await ctx.db
      .query("githubSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    return row?.filters ?? null;
  },
});

export const upsert = mutation({
  args: {
    filters: v.object({
      onlyAssigned: v.optional(v.boolean()),
      onlyReviewRequested: v.optional(v.boolean()),
      labelsInclude: v.optional(v.array(v.string())),
      reposInclude: v.optional(v.array(v.string())),
      reposExclude: v.optional(v.array(v.string())),
    }),
  },
  returns: v.null(),
  handler: async (ctx, { filters }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const existing = await ctx.db
      .query("githubSettings")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    if (!existing) {
      await ctx.db.insert("githubSettings", { userId: user._id, filters });
    } else {
      await ctx.db.patch(existing._id, { filters });
    }
    return null;
  },
});
```

2. `convex/sessions.ts`

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./users";

export const start = mutation({
  args: { totalCount: v.number() },
  returns: v.id("swipeSessions"),
  handler: async (ctx, { totalCount }) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db.insert("swipeSessions", {
      userId: user._id,
      startedAt: Date.now(),
      totalCount,
    });
  },
});

export const complete = mutation({
  args: { sessionId: v.id("swipeSessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) return null;
    await ctx.db.patch(sessionId, { completedAt: Date.now() });
    return null;
  },
});
```

3. `convex/swipes.ts`

```ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUserOrThrow } from "./users";

export const listByUser = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("swipes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const record = mutation({
  args: {
    sessionId: v.optional(v.id("swipeSessions")),
    itemId: v.string(),
    repository: v.string(),
    number: v.number(),
    isPullRequest: v.boolean(),
    decision: v.union(
      v.literal("APPROVE"),
      v.literal("REQUEST_CHANGES"),
      v.literal("ACK"),
      v.literal("NEEDS_DISCUSSION")
    ),
    note: v.optional(v.string()),
  },
  returns: v.object({ created: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const dedupeKey = `${user._id}|${args.repository}|${args.number}|${args.decision}`;
    const dupe = await ctx.db
      .query("swipes")
      .withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", dedupeKey))
      .unique();
    if (dupe) return { created: false, reason: "duplicate" };

    await ctx.db.insert("swipes", {
      userId: user._id,
      sessionId: args.sessionId,
      itemId: args.itemId,
      repository: args.repository,
      number: args.number,
      isPullRequest: args.isPullRequest,
      decision: args.decision,
      note: args.note,
      createdAt: Date.now(),
      dedupeKey,
    });
    return { created: true };
  },
});
```

4. `convex/github.ts` (internal actions)

```ts
"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const postReview = internalAction({
  args: {
    repository: v.string(),
    number: v.number(),
    decision: v.union(v.literal("APPROVE"), v.literal("REQUEST_CHANGES")),
    body: v.optional(v.string()),
  },
  returns: v.object({ ok: v.boolean(), status: v.number(), message: v.optional(v.string()) }),
  handler: async (ctx, { repository, number, decision, body }) => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return { ok: false, status: 500, message: "Missing GITHUB_TOKEN" };
    const url = `https://api.github.com/repos/${repository}/pulls/${number}/reviews`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event: decision, body: body ?? undefined }),
    });
    if (!res.ok) {
      const message = await res.text().catch(() => undefined);
      return { ok: false, status: res.status, message };
    }
    return { ok: true, status: res.status };
  },
});
```

### Next.js Routes — Short-Term Hardening

- `app/api/github/issues/route.ts`

  - Validate authenticated user with Clerk server helpers (optional for MVP since middleware guards, but recommended to bind a user to the session start).
  - Accept query params for pagination and filters. Build GitHub search query server-side.
  - Parse rate limit headers: `x-ratelimit-remaining`, `x-ratelimit-reset`; return them to client for UI messaging.

- `app/api/github/review/route.ts`
  - Validate inputs and Clerk auth.
  - After posting to GitHub, call `internal.swipes.record` via a Next server-side Convex client or use the Convex client on the client after the POST returns. Prefer server-side call to ensure persistence even if the client reloads.
  - On error (403 rate limit, 404 not found, 422 invalid state), map to consistent JSON error shape, and still write an `auditLogs` entry via Convex.

### UI — `app/dashboard/issue-review/page.tsx`

- Create a session on first load using Convex `sessions.start(totalCount)` after fetching the first page size.
- On every swipe:
  - Optimistically advance the card.
  - If PR: POST `/api/github/review` with decision + template body.
  - Call `convex.swipes.record` with `{ sessionId, itemId, repository, number, isPullRequest, decision, note }` for both PRs and issues.
  - Handle errors with toasts; on failure to post review but success to record, show "Recorded locally; GitHub will retry later" (retry path optional in M0).
- Show active filters summary; link to a basic Settings page (M0: placeholder OK).

### Error Handling and Idempotency

- Idempotency for swipes: dedupe by `userId|repository|number|decision` via `swipes.by_dedupeKey`.
- PR review failures:
  - 401/403: Show toast; still record swipe. Consider cooldown.
  - 404/422: Likely closed/draft; record swipe; surface as info.
  - Network: Show retry option; local record persists.
- Emit `auditLogs` for each attempt: `{ kind: "github.review.posted" | "github.review.failed" | "swipe.recorded", metadata, userId? }`.

### Tests (M0)

- Unit tests: Transform GitHub search responses to `IssueLike` (shape used in UI).
- Integration (MSW): Mock `/api/github/issues` and `/api/github/review` for success and error paths; ensure UI advances and records.
- Type tests: Ensure Convex validators align with TS signatures.

### Definition of Done (M0)

- Swipes persist in Convex with idempotency.
- Sessions start/complete tracked.
- Review posts either succeed or clearly report errors; failures still record swipes and log audits.
- Settings can be saved and read (even if not fully applied server-side yet).

---

## Phase M1 — Filters and History

### Goals

- Apply server-side filters to feed; add history and export.

### Tasks

- Extend `app/api/github/issues/route.ts` to read `githubSettings` and compose the GitHub search query:
  - Base: `is:open is:issue,pr involves:@me archived:false`
  - Optional: `assignee:@me`, `review-requested:@me`, `label:foo`, `repo:owner/name` includes/excludes.
- Add `app/dashboard/history/page.tsx` with paginated list from `swipes.listByUser`.
- Add export CSV button on history page.
- Add `app/dashboard/settings/page.tsx` that calls `settings.get/upsert` with a small form.

### Tests (M1)

- Unit: Query string composer for GitHub search.
- Integration: Settings update reflects in feed; history paginates.

### DoD (M1)

- Filters persist and affect the feed within one reload.
- User can browse history and export a CSV snapshot.

---

## Phase M2 — PR Context and Risk Hints

### Goals

- Provide PR context: changed files summary, CI status badges, and basic risk hints before swiping.

### Tasks

- New server route(s) or Convex action(s) to fetch PR details:
  - `GET /repos/{owner}/{repo}/pulls/{number}/files`
  - CI status: `GET /repos/{owner}/{repo}/commits/{sha}/status` or Checks API.
- Extend UI card to display:
  - Files changed (count, top-level paths), additions/deletions.
  - CI status (success/failure/pending).
  - Optional: summarize description with a small language model call (local or OpenAI) — gated behind a flag.

### Tests (M2)

- Integration: PR details load and render; errors degrade gracefully.

### DoD (M2)

- PR cards show files summary and CI status for most repos where token allows.

---

## Phase M3 — AuthZ & Multi-user Tokens

### Goals

- Attribute actions to the real user; restrict actions to repos a user can access.

### Tasks

- Add per-user GitHub OAuth via Clerk or GitHub App installation.
- Store per-user tokens in Convex environment variables or encrypted storage; never expose to client.
- Update `github.postReview` and feed search to use per-user tokens.
- Add repo allowlist settings and enforce on the server.

### DoD (M3)

- Reviews are posted as the authenticated user or via a GitHub App on their behalf, with server-side policy enforcement.

---

## Phase M4 — Merge & Automation

### Goals

- Super-like gesture to merge PR when guardrails pass; comment templates and small automations.

### Tasks

- Add UI super-like; new server action: `github.mergePullRequest` under guardrails:
  - Checks pass, branch up-to-date, required approvals met.
  - Optionally squash rebase strategy configurable in settings.
- Comment templates for `REQUEST_CHANGES`; allow quick-pick notes.
- Optional: auto-assign follow-up issues.

### DoD (M4)

- Users can merge under safe conditions from the UI; templated comments are available.

---

## Security, Resiliency, and Observability

- AuthN/AuthZ: Clerk middleware in `middleware.ts` continues to gate `/dashboard` and `/api`; Convex functions derive `userId` from `ctx.auth`.
- Secrets: `GITHUB_TOKEN` and per-user tokens only used server-side.
- Rate limiting: Read and respect GitHub rate limit headers; show UI hints when approaching limits; optionally store snapshots to a `githubRateLimits` table.
- Logging: `auditLogs` for actions and failures; include correlation ID per session.
- Sentry/Telemetry: Add basic error reporting in server routes and Convex actions (redact secrets).

---

## Developer Workflow

1. Add schema and Convex modules listed in M0.
2. Wire session creation and swipe recording in UI; keep posting reviews via Next route initially.
3. Add settings page and read settings to compose feed queries.
4. Implement tests (unit → integration → E2E) per phase.
5. Ensure green build; verify lint and types.

### Checklists

- Schema

  - [ ] `swipeSessions` with `by_userId`
  - [ ] `swipes` with `by_userId`, `by_repository_and_number`, `by_dedupeKey`
  - [ ] `githubSettings` with `by_userId`
  - [ ] `auditLogs` with `by_userId_and_createdAt`

- Convex Functions

  - [ ] `settings.get`, `settings.upsert`
  - [ ] `sessions.start`, `sessions.complete`
  - [ ] `swipes.listByUser`, `swipes.record`
  - [ ] `github.postReview` (internal action)

- Next.js Routes

  - [ ] Harden `/api/github/issues` with filters and pagination
  - [ ] Harden `/api/github/review` with error mapping and Convex persistence

- UI

  - [ ] Session lifecycle in `issue-review` page
  - [ ] Hook to record swipes via Convex
  - [ ] Settings page (basic)
  - [ ] History page (M1)

- Tests
  - [ ] Unit: mappers and validators
  - [ ] Integration: MSW routes for GitHub
  - [ ] E2E: swipe flow, error toasts

---

## Notes on Convex Usage (Compliance with House Rules)

- Always use new function syntax with explicit `args` and `returns` validators.
- Use `withIndex` and `.paginate` instead of `.filter`.
- Separate public vs internal functions; call via `api.*` and `internal.*` using `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction`.
- Use `v.null()` when returning nothing.
- Only call actions from actions if crossing runtimes is required; otherwise share helpers.
- Be strict with `Id` types and prefer `Id<'table'>` over `string` for document IDs.

---

## Acceptance Criteria Snapshot

- M0: Swipes and sessions persist with idempotency; reviews post or fail gracefully; minimal settings persisted.
- M1: Filters applied server-side; history and export available.
- M2: PR context (files, CI) visible; degradation handled.
- M3: Per-user tokens; policy enforcement.
- M4: Merge with guardrails; comment templates.

---

## Appendix: Payload Shapes

- Issue/PR feed item (UI):

```ts
type IssueLike = {
  id: string;
  title: string;
  body: string;
  number: number;
  html_url: string;
  repository: string; // owner/repo
  author: string;
  isPullRequest: boolean;
};
```

- Swipe record (Convex):

```ts
type SwipeInput = {
  sessionId?: Id<"swipeSessions">;
  itemId: string;
  repository: string;
  number: number;
  isPullRequest: boolean;
  decision: "APPROVE" | "REQUEST_CHANGES" | "ACK" | "NEEDS_DISCUSSION";
  note?: string;
};
```
