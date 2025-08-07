import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
