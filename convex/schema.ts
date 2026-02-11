import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  writings: defineTable({
    title: v.string(),
    content: v.string(),
    slug: v.string(),
    published: v.boolean(),
  }).index("by_slug", ["slug"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
