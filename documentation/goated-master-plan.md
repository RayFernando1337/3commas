# GitHub Swipe Reviewer — The Goated Master Plan

## 1) Vision and Goals

- Purpose: Make code and issue review playful and fast using a Tinder-like swipe UI to encourage daily hygiene on GitHub issues and PRs.
- Primary actions:
  - Swipe right: Approve PR (submit GitHub review APPROVE). For issues, mark as “Acknowledged”.
  - Swipe left: Request changes (submit GitHub review REQUEST_CHANGES). For issues, mark “Needs discussion”.
  - Optional future: Super-like/up swipe for Comment/Merge.
- Success: Users can fetch their open issues/PRs, swipe through them, and for PRs, automatically create a review in GitHub. Decisions are persisted to Convex for history, analytics, and personalization.

## 2) Current Implementation Snapshot (Grounded)

- UI: `app/dashboard/issue-review/page.tsx` renders a swipeable card deck using `react-swipeable` with optimistic advance.
- Server routes:
  - `GET /api/github/issues`: Blended search from GitHub Search API using a server-side `GITHUB_TOKEN`.
  - `POST /api/github/review`: Posts APPROVE/REQUEST_CHANGES for PRs.
- Auth:
  - Clerk middleware protects all dashboard pages and API routes via `middleware.ts`.
- Convex:
  - `users` table exists and is synced via Clerk webhooks in `convex/http.ts`.
  - `paymentAttempts` table exists (unrelated to swipe feature but demonstrates Convex wiring).

## 3) Architecture Overview

- UI (Next.js App Router):
  - Page: `app/dashboard/issue-review/page.tsx`
  - Libraries: `react-swipeable`, `framer-motion` (overlays/animations), `sonner` (toasts)
- Server Routes (Next):
  - `GET /api/github/issues`: returns inbox items.
  - `POST /api/github/review`: posts GitHub PR reviews.
  - New: `POST /api/github/swipe`: logs decision to Convex and posts GitHub review when applicable, idempotently.
- Convex:
  - Persistence for sessions, swipes, and user filters.
  - Public queries for reading, internal mutations for writes, optional actions for GitHub calls later.
- AuthN/Z:
  - Clerk-protected dashboard and API routes.
  - Convex resolves user via Clerk identity (mapped to `users.externalId`).

## 4) Data Model (Convex)

Add the following tables to `convex/schema.ts` (follow Convex validator/index rules). Index fields must appear in index order, and we avoid `.filter()` in queries by using `withIndex`.

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Existing tables ... users, paymentAttempts

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
    repository: v.string(), // "owner/repo"
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
  })
    .index("by_userId", ["userId"])
    .index("by_repository_and_number", ["repository", "number"])
    .index("by_userId_repository_and_number", ["userId", "repository", "number"]),

  githubSettings: defineTable({
    userId: v.id("users"),
    filters: v.optional(
      v.object({
        onlyAssigned: v.optional(v.boolean()),
        onlyReviewRequested: v.optional(v.boolean()),
        labelsInclude: v.optional(v.array(v.string())),
        reposInclude: v.optional(v.array(v.string())),
      })
    ),
  }).index("by_userId", ["userId"]),
});
```

## 5) API Design (Next API Routes)

- GET `/api/github/issues`

  - Query params (optional):
    - `page?: number` (default 1), `per_page?: number` (default 25, max 50)
    - Future filters: `onlyAssigned`, `onlyReviewRequested`, `labels`, `repos`
  - Response item shape:
    - `{ id: string, title: string, body: string, number: number, html_url: string, repository: string, author: string, isPullRequest: boolean, updated_at?: string, labels?: string[] }`

- POST `/api/github/review`

  - Body: `{ repository: string, number: number, decision: "APPROVE" | "REQUEST_CHANGES", body?: string }`
  - Returns: `204` on success; `400` invalid input; `502` on GitHub error.

- NEW: POST `/api/github/swipe`

  - Body:
    ```json
    {
      "item": { "id": "string", "repository": "owner/repo", "number": 123, "isPullRequest": true },
      "decision": "APPROVE" | "REQUEST_CHANGES" | "ACK" | "NEEDS_DISCUSSION",
      "note": "optional text",
      "sessionId": "optional convex id"
    }
    ```
  - Behavior:
    - Resolve authenticated user via Clerk in the route.
    - Call Convex `internal.swipes.log` to persist decision.
    - If `isPullRequest` and decision is `APPROVE` or `REQUEST_CHANGES`, post review to GitHub unless a deduped recent identical decision exists.
  - Returns: `{ logged: boolean, postedReview: boolean }`

- Optional:
  - GET `/api/github/swipes/history?limit=50` → recent swipes via Convex `swipes.listRecent`.
  - GET/POST `/api/github/settings` → `githubSettings.get` / `githubSettings.set`.

## 6) Convex Functions (New Function Syntax)

Follow Convex guidelines:

- Always include `args` validators and `returns` validators, using `v.null()` when no return.
- Use `.withIndex` instead of `.filter`.
- Use `query`, `mutation`, `action` for public; `internalQuery`, `internalMutation`, `internalAction` for private.
- For Node APIs inside actions, add `"use node";` at the file top.

### `convex/swipes.ts`

```ts
import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const log = internalMutation({
  args: {
    userId: v.id("users"),
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
    sessionId: v.optional(v.id("swipeSessions")),
  },
  returns: v.object({ created: v.boolean(), swipeId: v.id("swipes") }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_userId_repository_and_number", (q) =>
        q.eq("userId", args.userId).eq("repository", args.repository).eq("number", args.number)
      )
      .order("desc")
      .take(1);

    const last = existing[0];
    const duplicate =
      last && last.decision === args.decision && Date.now() - last.createdAt < 60 * 60 * 1000;

    if (duplicate) return { created: false, swipeId: last._id };

    const swipeId = await ctx.db.insert("swipes", {
      userId: args.userId,
      sessionId: args.sessionId,
      itemId: args.itemId,
      repository: args.repository,
      number: args.number,
      isPullRequest: args.isPullRequest,
      decision: args.decision,
      note: args.note,
      createdAt: Date.now(),
    });

    return { created: true, swipeId };
  },
});

export const listRecent = query({
  args: { userId: v.id("users"), limit: v.number() },
  returns: v.array(
    v.object({
      _id: v.id("swipes"),
      _creationTime: v.number(),
      userId: v.id("users"),
      repository: v.string(),
      number: v.number(),
      decision: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, { userId, limit }) => {
    return await ctx.db
      .query("swipes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});
```

### `convex/swipeSessions.ts`

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const start = mutation({
  args: { userId: v.id("users"), totalCount: v.number() },
  returns: v.id("swipeSessions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("swipeSessions", {
      userId: args.userId,
      startedAt: Date.now(),
      totalCount: args.totalCount,
    });
  },
});

export const end = mutation({
  args: { sessionId: v.id("swipeSessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    await ctx.db.patch(sessionId, { completedAt: Date.now() });
    return null;
  },
});

export const getActive = query({
  args: { userId: v.id("users") },
  returns: v.union(v.id("swipeSessions"), v.null()),
  handler: async (ctx, { userId }) => {
    const last = await ctx.db
      .query("swipeSessions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    return last[0]?._id ?? null;
  },
});
```

### `convex/githubSettings.ts`

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const filtersValidator = v.object({
  onlyAssigned: v.optional(v.boolean()),
  onlyReviewRequested: v.optional(v.boolean()),
  labelsInclude: v.optional(v.array(v.string())),
  reposInclude: v.optional(v.array(v.string())),
});

export const get = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({ userId: v.id("users"), filters: v.optional(filtersValidator) }),
    v.null()
  ),
  handler: async (ctx, { userId }) => {
    const row = await ctx.db
      .query("githubSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return row ?? null;
  },
});

export const set = mutation({
  args: { userId: v.id("users"), filters: filtersValidator },
  returns: v.null(),
  handler: async (ctx, { userId, filters }) => {
    const row = await ctx.db
      .query("githubSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (row) await ctx.db.patch(row._id, { filters });
    else await ctx.db.insert("githubSettings", { userId, filters });
    return null;
  },
});
```

## 7) UI/UX Design

- Deck UI: one card visible; stack peeks underneath.
- Card details: title, repo, number, type (Issue or PR), author, relative updated time; labels as chips.
- Gestures/actions:
  - Swipe right → Approve PR or Acknowledge Issue.
  - Swipe left → Request changes PR or Needs discussion Issue.
  - Buttons mirror gestures; keyboard left/right.
- Feedback:
  - Framer-motion overlays: “Approve ✅”, “Changes ❌”.
  - Toasts on errors/success (sonner).
- Progress: percentage done; refresh button.
- History (M1): show recent swipes via Convex `swipes.listRecent`.

## 8) Security and Permissions

- Keep `GITHUB_TOKEN` server-only; never in client.
- Clerk protects dashboard and API routes (already configured).
- Convex reads Clerk identity and maps to `users.externalId`.
- Future: per-user GitHub OAuth or GitHub App; tokens stored server-side only.

## 9) Idempotency, Race Safety, and Rate Limits

- Idempotency: Use `swipes.by_userId_repository_and_number` to dedupe identical decisions within a time window (e.g., 1 hour) before posting another review.
- Race safety: Logging and review posting handled in a single API request; if later moved to Convex actions, minimize cross-runtime calls and keep transactions small.
- Rate limits: On GitHub 403/rate-limited, still persist swipe and surface a non-blocking toast; optionally queue retries in future.

## 10) Testing Strategy

- Unit:
  - Mapper: GitHub Search API → item shape for `/issues`.
  - Convex: `swipes.log` dedupe behavior via composite index.
- Integration:
  - API routes with MSW for GitHub responses and failure modes.
- E2E (Playwright):
  - Swipe flows, keyboard shortcuts, optimistic progress, error toasts.
- Type safety: Every Convex function includes `returns` validators; narrow response shapes in API routes.

## 11) Observability and Analytics

- Server logs for swipes and review posts: include user id, repo, number, decision, postedReview flag.
- Optional (future): `events` table in Convex for analytics; derive per-user streaks and coverage.

## 12) Performance

- Keep page sizes small (`per_page<=25`) and lazy-load details.
- Prefetch next item while user reads current.
- Avoid blocking UI on review POST; fire-and-forget with feedback.

## 13) Configuration and Setup

- Environment variables:
  - `GITHUB_TOKEN` (server-only)
  - `NEXT_PUBLIC_CONVEX_URL`
  - `CLERK_WEBHOOK_SECRET`, `CLERK_*`
- Local dev: add to `.env.local`.
- Package manager: pnpm (lockfile present).

## 14) Rollout Plan and Milestones

- M0 — MVP with persistence

  - Convex: add `swipeSessions`, `swipes`, `githubSettings` + indexes.
  - Convex: implement `swipes.log`, `swipes.listRecent`, `swipeSessions.start/end`, `githubSettings.get/set`.
  - API: add `POST /api/github/swipe` to log + optionally post review with dedupe.
  - UI: call `/api/github/swipe` on swipe; add toasts/overlays; enrich `/issues` with `labels`, `updated_at`.

- M1 — Filters and History

  - UI filters wired to `githubSettings`; filter in `/issues`.
  - History panel/page using `swipes.listRecent`.

- M2 — Rich PR Context

  - Show changed files, diff summary, CI status badges.

- M3 — AuthZ & Per-user GitHub

  - Per-user OAuth or GitHub App; drop global PAT.

- M4 — Automation
  - Merge PR on super-like with guardrails (CI green, required approvals met).

## 15) Acceptance Criteria (for each milestone)

- M0 AC:
  - Users can load inbox, swipe through items, and see reviews posted for PRs.
  - Decisions persisted to Convex; duplicates suppressed by dedupe logic.
  - Error handling and toasts are in place; progress updates correctly.

## 16) Risks and Mitigations

- Duplicate/noisy reviews → Dedup window + local logs.
- GitHub rate limits → Persist locally; show non-blocking errors; later add caching.
- Security of tokens → Server-only storage; move to per-user auth when ready.

## 17) Optional: Move GitHub Calls to Convex Actions

```ts
"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

export const postReview = action({
  args: {
    repository: v.string(),
    number: v.number(),
    decision: v.string(),
    body: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Use process.env in Convex deployment env for GitHub token
    // fetch(...) to GitHub API
    return null;
  },
});
```

This keeps all server-to-server calls consolidated and versioned in Convex while maintaining strict validators and return types.

---

This plan is designed to be executed incrementally while remaining aligned with Convex best practices (new function syntax, validators, indexes, no `.filter()`, explicit `returns`). It builds directly on the current code, adds durable persistence, and sets a clean path to richer features and per-user GitHub auth.
