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
    coverImageId: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),

  chapters: defineTable({
    writingId: v.id("writings"),
    title: v.string(),
    content: v.string(),
    chapterNumber: v.number(),
    published: v.boolean(),
    updatedAt: v.optional(v.number()),
  }).index("by_writing", ["writingId"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
