import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("mockIssues"),
      _creationTime: v.number(),
      id: v.string(),
      title: v.string(),
      body: v.string(),
      number: v.number(),
      html_url: v.string(),
      repository: v.string(),
      author: v.string(),
      isPullRequest: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query("mockIssues").order("desc").take(100);
  },
});

export const clear = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const all = await ctx.db.query("mockIssues").order("desc").take(1000);
    for (const row of all) {
      await ctx.db.delete(row._id);
    }
    return null;
  },
});

export const seed = mutation({
  args: {
    count: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, { count }) => {
    const repos = ["openai/openai", "vercel/next.js", "convex-dev/convex"];
    let inserted = 0;
    for (let i = 0; i < count; i++) {
      const repo = repos[i % repos.length];
      const isPR = i % 2 === 0;
      const number = 100 + i;
      await ctx.db.insert("mockIssues", {
        id: `${repo}#${number}`,
        title: `${isPR ? "PR" : "Issue"} ${number}: Example title`,
        body: isPR
          ? "This is a mock pull request for testing the swipe UI.\n\n- Change A\n- Change B"
          : "This is a mock issue description for testing the swipe UI.",
        number,
        html_url: `https://github.com/${repo}/${isPR ? "pull" : "issues"}/${number}`,
        repository: repo,
        author: "mock-user",
        isPullRequest: isPR,
      });
      inserted++;
    }
    return inserted;
  },
});
