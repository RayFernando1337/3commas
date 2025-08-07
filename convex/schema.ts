import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { paymentAttemptSchemaValidator } from "./paymentAttemptTypes";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    // this the Clerk ID, stored in the subject JWT field
    externalId: v.string(),
  }).index("byExternalId", ["externalId"]),

  paymentAttempts: defineTable(paymentAttemptSchemaValidator)
    .index("byPaymentId", ["payment_id"])
    .index("byUserId", ["userId"])
    .index("byPayerUserId", ["payer.user_id"]),

  // Swipe sessions track a batch of reviews for a given user
  swipeSessions: defineTable({
    userId: v.id("users"),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    totalCount: v.number(),
  }).index("by_userId", ["userId"]),

  // Individual swipe decisions
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

  // Per-user GitHub inbox filters
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
