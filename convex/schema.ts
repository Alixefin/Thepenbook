import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  writings: defineTable({
    title: v.string(),
    content: v.string(),
    slug: v.string(),
    published: v.boolean(),
    category: v.optional(v.string()),
    colorTag: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
