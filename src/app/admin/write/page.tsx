"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
    generateSlug,
    DEFAULT_CATEGORIES,
    COLOR_PRESETS,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function WritePage() {
    const router = useRouter();
    const createWriting = useMutation(api.writings.create);
    const updateWriting = useMutation(api.writings.update);

    // Custom categories from settings
    const customCatsRaw = useQuery(api.writings.getSetting, {
        key: "customCategories",
    });
    const customCats: string[] = customCatsRaw
        ? JSON.parse(customCatsRaw)
        : [];
    const allCategories = [...DEFAULT_CATEGORIES, ...customCats];

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [slug, setSlug] = useState("");
    const [category, setCategory] = useState("");
    const [colorTag, setColorTag] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [docId, setDocId] = useState<Id<"writings"> | null>(null);
    const [newCategory, setNewCategory] = useState("");
    const [showNewCat, setShowNewCat] = useState(false);

    const setSetting = useMutation(api.writings.setSetting);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setSlug(title ? generateSlug(title) : "");
    }, [title]);

    const autoSave = useCallback(
        async (t: string, c: string) => {
            if (!t.trim()) return;
            setSaving(true);
            try {
                const s = generateSlug(t);
                if (docId) {
                    await updateWriting({
                        id: docId,
                        title: t,
                        content: c,
                        slug: s,
                        category: category || undefined,
                        colorTag: colorTag || undefined,
                    });
                } else {
                    const id = await createWriting({
                        title: t,
                        content: c,
                        slug: s,
                        published: false,
                        category: category || undefined,
                        colorTag: colorTag || undefined,
                    });
                    setDocId(id);
                }
                setLastSaved(new Date());
            } catch (err) {
                console.error("Auto-save failed:", err);
            }
            setSaving(false);
        },
        [docId, createWriting, updateWriting, category, colorTag]
    );

    const triggerAutoSave = useCallback(
        (t: string, c: string) => {
            if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => autoSave(t, c), 1500);
        },
        [autoSave]
    );

    const handlePublish = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            if (docId) {
                await updateWriting({
                    id: docId,
                    title,
                    content,
                    slug,
                    published: true,
                    category: category || undefined,
                    colorTag: colorTag || undefined,
                });
            } else {
                await createWriting({
                    title,
                    content,
                    slug,
                    published: true,
                    category: category || undefined,
                    colorTag: colorTag || undefined,
                });
            }
            router.push("/admin");
        } catch (err) {
            console.error("Publish failed:", err);
        }
        setSaving(false);
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        const updated = [...customCats, newCategory.trim()];
        await setSetting({
            key: "customCategories",
            value: JSON.stringify(updated),
        });
        setCategory(newCategory.trim());
        setNewCategory("");
        setShowNewCat(false);
    };

    return (
        <div>
            <div className="write-header">
                <div className="write-header-left">
                    <h2 className="write-heading">New Writing</h2>
                    {saving && <span className="save-indicator">Saving...</span>}
                    {!saving && lastSaved && (
                        <span className="save-indicator">Saved</span>
                    )}
                </div>
                <button
                    onClick={handlePublish}
                    disabled={!title.trim() || saving}
                    className="btn"
                >
                    Publish
                </button>
            </div>

            {slug && <p className="slug-preview">/{slug}</p>}

            {/* Category & Color Tag Row */}
            <div className="meta-row">
                <div className="meta-field">
                    <label className="meta-label">Category</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <select
                            value={category}
                            onChange={(e) => {
                                if (e.target.value === "__new__") {
                                    setShowNewCat(true);
                                } else {
                                    setCategory(e.target.value);
                                }
                            }}
                            className="meta-select"
                        >
                            <option value="">None</option>
                            {allCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                            <option value="__new__">+ Add New...</option>
                        </select>
                    </div>
                    {showNewCat && (
                        <div className="new-cat-row">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Category name"
                                className="meta-input"
                                autoFocus
                            />
                            <button onClick={handleAddCategory} className="btn btn-sm">
                                Add
                            </button>
                            <button
                                onClick={() => setShowNewCat(false)}
                                className="btn btn-sm"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                <div className="meta-field">
                    <label className="meta-label">Color Tag</label>
                    <div className="color-picker">
                        <button
                            onClick={() => setColorTag("")}
                            className={`color-swatch ${!colorTag ? "active" : ""}`}
                            title="None"
                            style={{
                                background: "transparent",
                                border: "1.5px dashed rgba(0,0,0,0.2)",
                            }}
                        >
                            ✕
                        </button>
                        {COLOR_PRESETS.map((c) => (
                            <button
                                key={c.hex}
                                onClick={() => setColorTag(c.hex)}
                                className={`color-swatch ${colorTag === c.hex ? "active" : ""}`}
                                title={c.name}
                                style={{ background: c.hex }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <input
                type="text"
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    triggerAutoSave(e.target.value, content);
                }}
                placeholder="Title"
                className="title-input"
                autoFocus
            />

            <Editor
                content={content}
                onUpdate={(html) => {
                    setContent(html);
                    triggerAutoSave(title, html);
                }}
            />
        </div>
    );
}
