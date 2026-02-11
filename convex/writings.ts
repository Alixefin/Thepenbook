import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── WRITINGS ────────────────────────────────────────

export const listPublished = query({
    args: {},
    handler: async (ctx) => {
        const writings = await ctx.db
            .query("writings")
            .order("desc")
            .filter((q) => q.eq(q.field("published"), true))
            .collect();
        return writings;
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        const writings = await ctx.db.query("writings").order("desc").collect();
        return writings;
    },
});

export const listByCategory = query({
    args: { category: v.string() },
    handler: async (ctx, args) => {
        const writings = await ctx.db
            .query("writings")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .order("desc")
            .filter((q) => q.eq(q.field("published"), true))
            .collect();
        return writings;
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const writing = await ctx.db
            .query("writings")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
        return writing;
    },
});

export const getById = query({
    args: { id: v.id("writings") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        slug: v.string(),
        published: v.boolean(),
        category: v.optional(v.string()),
        colorTag: v.optional(v.string()),
        coverImageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("writings", {
            title: args.title,
            content: args.content,
            slug: args.slug,
            published: args.published,
            category: args.category,
            colorTag: args.colorTag,
            coverImageId: args.coverImageId,
            updatedAt: Date.now(),
        });
        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("writings"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        slug: v.optional(v.string()),
        published: v.optional(v.boolean()),
        category: v.optional(v.string()),
        colorTag: v.optional(v.string()),
        coverImageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates[key] = value;
            }
        }
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("writings") },
    handler: async (ctx, args) => {
        // Also remove all chapters for this writing
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_writing", (q) => q.eq("writingId", args.id))
            .collect();
        for (const ch of chapters) {
            await ctx.db.delete(ch._id);
        }
        await ctx.db.delete(args.id);
    },
});

// ─── CHAPTERS ────────────────────────────────────────

export const listChapters = query({
    args: { writingId: v.id("writings") },
    handler: async (ctx, args) => {
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_writing", (q) => q.eq("writingId", args.writingId))
            .collect();
        // Sort by chapter number
        return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    },
});

export const getChapter = query({
    args: { writingId: v.id("writings"), chapterNumber: v.number() },
    handler: async (ctx, args) => {
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_writing", (q) => q.eq("writingId", args.writingId))
            .filter((q) => q.eq(q.field("chapterNumber"), args.chapterNumber))
            .first();
        return chapters;
    },
});

export const createChapter = mutation({
    args: {
        writingId: v.id("writings"),
        title: v.string(),
        content: v.string(),
        chapterNumber: v.number(),
        published: v.boolean(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("chapters", {
            writingId: args.writingId,
            title: args.title,
            content: args.content,
            chapterNumber: args.chapterNumber,
            published: args.published,
            updatedAt: Date.now(),
        });
        // Also update writing's updatedAt
        await ctx.db.patch(args.writingId, { updatedAt: Date.now() });
        return id;
    },
});

export const updateChapter = mutation({
    args: {
        id: v.id("chapters"),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        chapterNumber: v.optional(v.number()),
        published: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...fields } = args;
        const updates: Record<string, unknown> = { updatedAt: Date.now() };
        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates[key] = value;
            }
        }
        const chapter = await ctx.db.get(id);
        await ctx.db.patch(id, updates);
        // Update writing's updatedAt
        if (chapter) {
            await ctx.db.patch(chapter.writingId, { updatedAt: Date.now() });
        }
    },
});

export const removeChapter = mutation({
    args: { id: v.id("chapters") },
    handler: async (ctx, args) => {
        const chapter = await ctx.db.get(args.id);
        await ctx.db.delete(args.id);
        if (chapter) {
            await ctx.db.patch(chapter.writingId, { updatedAt: Date.now() });
        }
    },
});

// ─── SETTINGS ────────────────────────────────────────

export const getSetting = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        const setting = await ctx.db
            .query("settings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
        return setting?.value ?? null;
    },
});

export const getAllSettings = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("settings").collect();
        const map: Record<string, string> = {};
        for (const s of settings) {
            map[s.key] = s.value;
        }
        return map;
    },
});

export const setSetting = mutation({
    args: { key: v.string(), value: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("settings")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { value: args.value });
        } else {
            await ctx.db.insert("settings", { key: args.key, value: args.value });
        }
    },
});

// ─── FILE STORAGE ────────────────────────────────────

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getFileUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId as any);
    },
});
