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
    audioFileId: v.optional(v.string()),
    viewCount: v.optional(v.number()),
    dayPostedOn: v.optional(v.number()), // 0-6, day of week (0=Sunday)
    readers: v.optional(v.array(v.string())), // array of fingerprints for unique reader tracking
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"])
    .index("by_day", ["dayPostedOn"]),

  dayCategories: defineTable({
    day: v.number(), // 0-6, 0=Sunday
    name: v.string(),
    hexColor: v.string(), // e.g. "#FF5733"
    accentColor: v.string(), // secondary color
    heroHeadline: v.string(), // custom headline for that day
    active: v.boolean(),
  }).index("by_day", ["day"]),

  chapters: defineTable({
    writingId: v.id("writings"),
    title: v.string(),
    content: v.string(),
    chapterNumber: v.number(),
    published: v.boolean(),
    updatedAt: v.optional(v.number()),
  }).index("by_writing", ["writingId"]),

  comments: defineTable({
    writingId: v.id("writings"),
    name: v.string(),
    text: v.string(),
  }).index("by_writing", ["writingId"]),

  readRecords: defineTable({
    writingId: v.id("writings"),
    fingerprint: v.string(), // unique reader identifier
    timestamp: v.number(),
  })
    .index("by_writing", ["writingId"])
    .index("by_writing_fingerprint", ["writingId", "fingerprint"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
