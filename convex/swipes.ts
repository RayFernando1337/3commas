import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

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

export const logPublic = mutation({
  args: {
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_userId_repository_and_number", (q) =>
        q.eq("userId", user._id).eq("repository", args.repository).eq("number", args.number)
      )
      .order("desc")
      .take(1);

    const last = existing[0];
    const duplicate =
      last && last.decision === args.decision && Date.now() - last.createdAt < 60 * 60 * 1000;
    if (duplicate) return { created: false, swipeId: last._id };

    const swipeId = await ctx.db.insert("swipes", {
      userId: user._id,
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
