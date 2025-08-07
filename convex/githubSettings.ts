import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
