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
            viewCount: 0,
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
        // Remove all chapters
        const chapters = await ctx.db
            .query("chapters")
            .withIndex("by_writing", (q) => q.eq("writingId", args.id))
            .collect();
        for (const ch of chapters) {
            await ctx.db.delete(ch._id);
        }
        // Remove all comments
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_writing", (q) => q.eq("writingId", args.id))
            .collect();
        for (const c of comments) {
            await ctx.db.delete(c._id);
        }
        await ctx.db.delete(args.id);
    },
});

// ─── VIEW TRACKING ───────────────────────────────────

export const recordView = mutation({
    args: { id: v.id("writings") },
    handler: async (ctx, args) => {
        const writing = await ctx.db.get(args.id);
        if (writing) {
            await ctx.db.patch(args.id, {
                viewCount: (writing.viewCount || 0) + 1,
            });
        }
    },
});

// ─── COMMENTS ────────────────────────────────────────

export const listComments = query({
    args: { writingId: v.id("writings") },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_writing", (q) => q.eq("writingId", args.writingId))
            .order("desc")
            .collect();
        return comments;
    },
});

export const addComment = mutation({
    args: {
        writingId: v.id("writings"),
        name: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("comments", {
            writingId: args.writingId,
            name: args.name,
            text: args.text,
        });
        return id;
    },
});

export const removeComment = mutation({
    args: { id: v.id("comments") },
    handler: async (ctx, args) => {
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

// ─── DAY CATEGORIES ──────────────────────────────────

export const getDayCategory = query({
    args: { day: v.number() },
    handler: async (ctx, args) => {
        const dayCategory = await ctx.db
            .query("dayCategories")
            .withIndex("by_day", (q) => q.eq("day", args.day))
            .first();
        return dayCategory;
    },
});

export const getAllDayCategories = query({
    args: {},
    handler: async (ctx) => {
        const categories = await ctx.db.query("dayCategories").collect();
        return categories.sort((a, b) => a.day - b.day);
    },
});

export const getTodayCategory = query({
    args: {},
    handler: async (ctx) => {
        const today = new Date().getDay();
        const dayCategory = await ctx.db
            .query("dayCategories")
            .withIndex("by_day", (q) => q.eq("day", today))
            .first();
        return dayCategory;
    },
});

export const createDayCategory = mutation({
    args: {
        day: v.number(),
        name: v.string(),
        hexColor: v.string(),
        accentColor: v.string(),
        heroHeadline: v.string(),
        active: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Check if category already exists for this day
        const existing = await ctx.db
            .query("dayCategories")
            .withIndex("by_day", (q) => q.eq("day", args.day))
            .first();
        
        if (existing) {
            return existing._id;
        }

        const id = await ctx.db.insert("dayCategories", {
            day: args.day,
            name: args.name,
            hexColor: args.hexColor,
            accentColor: args.accentColor,
            heroHeadline: args.heroHeadline,
            active: args.active,
        });
        return id;
    },
});

export const updateDayCategory = mutation({
    args: {
        day: v.number(),
        name: v.optional(v.string()),
        hexColor: v.optional(v.string()),
        accentColor: v.optional(v.string()),
        heroHeadline: v.optional(v.string()),
        active: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("dayCategories")
            .withIndex("by_day", (q) => q.eq("day", args.day))
            .first();
        
        if (!existing) {
            throw new Error(`Day category for day ${args.day} not found`);
        }

        const updates: Record<string, unknown> = {};
        if (args.name !== undefined) updates.name = args.name;
        if (args.hexColor !== undefined) updates.hexColor = args.hexColor;
        if (args.accentColor !== undefined) updates.accentColor = args.accentColor;
        if (args.heroHeadline !== undefined) updates.heroHeadline = args.heroHeadline;
        if (args.active !== undefined) updates.active = args.active;

        await ctx.db.patch(existing._id, updates);
        return existing._id;
    },
});

// ─── UNIQUE READER TRACKING ──────────────────────────

export const recordUniqueView = mutation({
    args: {
        id: v.id("writings"),
        fingerprint: v.string(),
    },
    handler: async (ctx, args) => {
        const writing = await ctx.db.get(args.id);
        if (!writing) return;

        // Check if this fingerprint already read this writing
        const existing = await ctx.db
            .query("readRecords")
            .withIndex("by_writing_fingerprint", (q) =>
                q.eq("writingId", args.id).eq("fingerprint", args.fingerprint)
            )
            .first();

        if (!existing) {
            // New unique reader
            await ctx.db.insert("readRecords", {
                writingId: args.id,
                fingerprint: args.fingerprint,
                timestamp: Date.now(),
            });
            await ctx.db.patch(args.id, {
                viewCount: (writing.viewCount || 0) + 1,
                readers: [...(writing.readers || []), args.fingerprint],
            });
        }
    },
});

export const getUniqueViewCount = query({
    args: { id: v.id("writings") },
    handler: async (ctx, args) => {
        const writing = await ctx.db.get(args.id);
        return writing?.viewCount || 0;
    },
});

// ─── COMMENTS CAROUSEL ───────────────────────────────

export const getRecentComments = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const limitCount = args.limit || 10;
        const comments = await ctx.db
            .query("comments")
            .order("desc")
            .take(limitCount);

        // Enrich comments with writing titles
        const enriched = await Promise.all(
            comments.map(async (comment) => {
                const writing = await ctx.db.get(comment.writingId);
                return {
                    ...comment,
                    writingTitle: writing?.title || "Unknown",
                    writingSlug: writing?.slug || "",
                };
            })
        );

        return enriched;
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
