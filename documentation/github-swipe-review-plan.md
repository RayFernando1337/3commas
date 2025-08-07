## GitHub Swipe Reviewer – Product & Technical Plan

### 1) Vision and Goals

- **Purpose**: Make code and issue review playful and fast using a Tinder-like swipe UI to encourage daily hygiene on GitHub issues and PRs.
- **Primary actions**:
  - **Swipe right**: Approve PR (submit GitHub review APPROVE). For issues, mark as “Acknowledged” in our local log.
  - **Swipe left**: Request changes (submit GitHub review REQUEST_CHANGES). For issues, mark as “Needs discussion” in our local log.
  - Optional future: **Super-like/up swipe** to Leave Comment / Merge PR.
- **MVP success**: User can fetch their open issues/PRs, swipe through them, and for PRs, automatically create a review in GitHub.

References for inspiration and patterns:

- A simple React review app skeleton: [missop/react-review](https://github.com/missop/react-review)
- A Next.js GitHub issue viewer with tests: [kuroski/github-issue-viewer](https://github.com/kuroski/github-issue-viewer)

### 2) User Experience (Playful by design)

- **Deck UI**: One card visible at a time; subtle stack of next cards beneath. Card shows:
  - Title, repo, number, type (Issue or PR), author, relative updated time
  - Description excerpt; expand-on-demand; link to GitHub
  - Labels as colorful chips (optional future)
- **Gestures & actions**:
  - Swipe right → Approve PR or Acknowledge Issue
  - Swipe left → Request changes PR or Mark “Needs discussion” Issue
  - Click buttons mirror gestures for desktop users
  - Keyboard: Left/Right arrows map to swipe actions
- **Feedback**:
  - Animations with framer-motion
  - Overlays during swipe: “Approve ✅”, “Changes ❌”
  - Toasts (sonner) for errors/success
- **Progress**: Simple percentage done in the current queue; refresh button

### 3) Scope of MVP

- Fetch a combined feed of open issues and PRs involving the current user
  - Query via GitHub Search API with `involves:@me`, `is:open`, `issue,pr`, sorted by updated time
- Show a single card; swipe to advance
- If item is a PR, on swipe:
  - Right → POST review with `event: APPROVE`
  - Left → POST review with `event: REQUEST_CHANGES` and a default body
- If item is an Issue, record the local decision (Convex log) to assist future triage

### 4) Architecture Overview

- **UI** (Next.js App Router):
  - Page: `app/dashboard/issue-review/page.tsx`
  - Dependencies: `react-swipeable`, `framer-motion`, existing UI components (`Card`, `Button`)
- **Server Routes**:
  - `GET /api/github/issues`: fetches a blended list of issues/PRs for the user
  - `POST /api/github/review`: submits an approve/request-changes review for a PR
- **Auth**:
  - MVP: use a server-side `GITHUB_TOKEN` (PAT or GitHub App token) with repo read and PR review scopes
  - Future: per-user GitHub OAuth via Clerk (GitHub provider) or GitHub App for organization-wide installation
- **Persistence (Convex – future)**:
  - Store swipe decisions and notes for Issues and PRs
  - Store per-user filters and preferences

### 5) Current Implementation (MVP)

- UI page added: `app/dashboard/issue-review/page.tsx`
  - Renders a swipeable card, progress, actions, and GitHub link
  - Uses `/api/github/issues` for feed; `/api/github/review` for PR review actions
- Sidebar and header wiring:
  - `app/dashboard/app-sidebar.tsx`: Added `Issue Review` nav item
  - `app/dashboard/site-header.tsx`: Page title for `/dashboard/issue-review`
- Server routes:
  - `app/api/github/issues/route.ts`: GitHub Search API; maps items to a uniform shape
  - `app/api/github/review/route.ts`: Posts reviews with `APPROVE` or `REQUEST_CHANGES`
- Config:
  - Requires `GITHUB_TOKEN` in environment with at least `pull_request:write` and repo read permissions

### 6) Data Model (Convex, proposed additions)

Proposed new tables for tracking local state and enabling richer features.

```ts
// convex/schema.ts additions (proposed)
swipeSessions: defineTable({
  userId: v.id("users"),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
  totalCount: v.number(),
}),

swipes: defineTable({
  userId: v.id("users"),
  sessionId: v.optional(v.id("swipeSessions")),
  itemId: v.string(),            // GitHub global node id or "owner/repo#number"
  repository: v.string(),        // "owner/repo"
  number: v.number(),
  isPullRequest: v.boolean(),
  decision: v.string(),          // APPROVE | REQUEST_CHANGES | ACK | NEEDS_DISCUSSION
  note: v.optional(v.string()),
  createdAt: v.number(),
}).index("byUserId", ["userId"]).index("byItem", ["repository", "number"]),

githubSettings: defineTable({
  userId: v.id("users"),
  // For MVP we use a global GITHUB_TOKEN; later we can store per-user OAuth linkage metadata
  filters: v.optional(v.object({
    onlyAssigned: v.optional(v.boolean()),
    onlyReviewRequested: v.optional(v.boolean()),
    labelsInclude: v.optional(v.array(v.string())),
    reposInclude: v.optional(v.array(v.string())),
  })),
}).index("byUserId", ["userId"])
```

### 7) GitHub API Details

- Search feed (MVP):
  - `GET https://api.github.com/search/issues?q=is:open is:issue,pr involves:@me archived:false sort:updated-desc&per_page=25`
  - Map: title, body, number, html_url, repository_url → `owner/repo`, `pull_request` key presence to detect PR
- Submit PR review:
  - `POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews`
  - Body: `{ event: "APPROVE" | "REQUEST_CHANGES", body?: string }`
- Future endpoints:
  - List PR files to show change summary
  - Merge PR: `PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge`
  - Comments: `POST /repos/{owner}/{repo}/issues/{number}/comments`
- Rate limits:
  - Respect headers; consider exponential backoff; cache search results per session when feasible

### 8) Security and Permissions

- Use server-only `GITHUB_TOKEN`; do not expose to client
- Scope least privilege: `pull_request:write`, `repo:read`
- In future per-user OAuth, store tokens securely (not in client), rotate and revoke properly
- Restrict API routes to authenticated users via Clerk (middleware or server checks) in a follow-up

### 9) Error Handling & UX Fallbacks

- Fetch failures: show retry button, toast with error details (redacted)
- Review post failures: show toast and allow swiping to continue; optionally queue retry
- Empty feed: friendly “All caught up 🎉” state

### 10) Testing Strategy

- Unit tests: pure transforms of GitHub responses to UI items
- Component tests: swipe interactions, keyboard shortcuts, optimistic progress
- E2E: mock GitHub API using MSW/Playwright for deterministic runs
  - Draw inspiration from: [kuroski/github-issue-viewer](https://github.com/kuroski/github-issue-viewer)

### 11) Performance

- Limit initial page size; lazy-load details on demand
- Prefetch next item while user reads the current one
- Avoid blocking UI during review POST; fire-and-forget with status toast

### 12) Accessibility

- Keyboard: Left/Right arrows; Enter to open on GitHub; Esc to skip
- ARIA labels on action buttons; visible focus states (already provided by our UI kit)

### 13) Configuration

- Environment variables:
  - `GITHUB_TOKEN` (server-only). For local dev, add to `.env.local`.
- Optional filters (future): per-user preferences via Convex `githubSettings`

### 14) Roadmap and Milestones

- M0 – MVP (this PR):
  - Swipe UI, fetch feed, approve/request-changes for PRs
  - Global `GITHUB_TOKEN` config
- M1 – Filters and Persistence:
  - Convex tables for swipes and sessions; list history; per-user filters
- M2 – Rich PR context:
  - Show changed files, diffs summary, and CI status badges
- M3 – AuthZ & Multi-user:
  - GitHub OAuth per-user, limited to user’s repos; org GitHub App option
- M4 – Merge actions & Automation:
  - Merge PR on super-like if checks pass and required approvals met

### 15) Open Questions

- Do we target personal repos only or org repos too? If org, a GitHub App may be preferable
- What is the desired default PR review comment for REQUEST_CHANGES? Template per team?
- Should merging be allowed from the UI, and under which guardrails (CI green, required reviewers met)?

### 16) Acceptance Criteria (MVP)

- I can open `Dashboard → Issue Review` and see a list of my open issues/PRs
- I can swipe right on a PR and see an approval posted on GitHub
- I can swipe left on a PR and see a request-changes review posted on GitHub
- Errors are handled gracefully with visible feedback; progress updates as I advance
