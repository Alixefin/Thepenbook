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
    const generateUploadUrl = useMutation(api.writings.generateUploadUrl);
    const setSetting = useMutation(api.writings.setSetting);

    // Day categories from Convex
    const dayCategories = useQuery(api.writings.getAllDayCategories);

    // Custom sub-categories
    const customCatsRaw = useQuery(api.writings.getSetting, {
        key: "customCategories",
    });
    const customCats: string[] = customCatsRaw
        ? JSON.parse(customCatsRaw)
        : [];
    const allSubCategories = [...DEFAULT_CATEGORIES, ...customCats];

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [slug, setSlug] = useState("");
    const [category, setCategory] = useState(""); // acts as sub-category
    const [dayPostedOn, setDayPostedOn] = useState<number | undefined>(undefined); // acts as primary day category
    const [colorTag, setColorTag] = useState("");
    const [coverImageId, setCoverImageId] = useState("");
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [docId, setDocId] = useState<Id<"writings"> | null>(null);
    const [newCategory, setNewCategory] = useState("");
    const [showNewCat, setShowNewCat] = useState(false);
    const [uploading, setUploading] = useState(false);

    const coverInputRef = useRef<HTMLInputElement>(null);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    // Get cover image URL
    const coverUrl = useQuery(
        api.writings.getFileUrl,
        coverImageId ? { storageId: coverImageId } : "skip"
    );

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
                        coverImageId: coverImageId || undefined,
                        dayPostedOn: dayPostedOn,
                    });
                } else {
                    const id = await createWriting({
                        title: t,
                        content: c,
                        slug: s,
                        published: false,
                        category: category || undefined,
                        colorTag: colorTag || undefined,
                        coverImageId: coverImageId || undefined,
                        dayPostedOn: dayPostedOn,
                    });
                    setDocId(id);
                }
                setLastSaved(new Date());
            } catch (err) {
                console.error("Auto-save failed:", err);
            }
            setSaving(false);
        },
        [docId, createWriting, updateWriting, category, colorTag, coverImageId, dayPostedOn]
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
        
        // Validation: require a primary daily category
        if (dayPostedOn === undefined) {
            alert("Please select a Daily Category/Theme before publishing!");
            return;
        }

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
                    coverImageId: coverImageId || undefined,
                    dayPostedOn: dayPostedOn,
                });
            } else {
                await createWriting({
                    title,
                    content,
                    slug,
                    published: true,
                    category: category || undefined,
                    colorTag: colorTag || undefined,
                    coverImageId: coverImageId || undefined,
                    dayPostedOn: dayPostedOn,
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

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }
        setUploading(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!response.ok) throw new Error("Upload failed");
            const { storageId } = await response.json();
            setCoverImageId(storageId);
        } catch (err) {
            console.error("Cover upload failed:", err);
            alert("Upload failed. Please try again.");
        }
        setUploading(false);
        if (coverInputRef.current) coverInputRef.current.value = "";
    };

    // Check if this category supports chapters
    const hasChapters =
        category === "Novel" || category === "Short Stories";

    // Handle day selection (auto-applies day colors to spine color tag)
    const handleDayChange = (dayNum: number | undefined) => {
        setDayPostedOn(dayNum);
        if (dayNum !== undefined && dayCategories) {
            const selected = dayCategories.find((dc) => dc.day === dayNum);
            if (selected) {
                setColorTag(selected.hexColor);
            }
        }
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
                <div style={{ display: "flex", gap: 8 }}>
                    {hasChapters && docId && (
                        <button
                            onClick={() => router.push(`/admin/edit/${docId}/chapters`)}
                            className="btn"
                        >
                            Chapters
                        </button>
                    )}
                    <button
                        onClick={handlePublish}
                        disabled={!title.trim() || saving}
                        className="btn"
                    >
                        Publish
                    </button>
                </div>
            </div>

            {slug && <p className="slug-preview">/{slug}</p>}

            {/* Category & Color Tag Row */}
            <div className="meta-row" style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {/* 1. Primary Daily Theme Category */}
                <div className="meta-field" style={{ flex: 1, minWidth: "200px" }}>
                    <label className="meta-label">Daily Category (Primary Theme)*</label>
                    <select
                        value={dayPostedOn !== undefined ? dayPostedOn : ""}
                        onChange={(e) => {
                            const val = e.target.value;
                            handleDayChange(val === "" ? undefined : parseInt(val, 10));
                        }}
                        className="meta-select"
                        style={{ width: "100%", outline: "none", border: "1.5px solid var(--color-border-strong)", borderRadius: "12px", padding: "10px 14px", appearance: "none" }}
                    >
                        <option value="">-- Select Daily Theme --</option>
                        {dayCategories && dayCategories.filter(d => d.active).map((dc) => (
                            <option key={dc.day} value={dc.day}>
                                {dc.name} ({["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dc.day]})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Format / Sub-Category */}
                <div className="meta-field" style={{ flex: 1, minWidth: "200px" }}>
                    <label className="meta-label">Sub-Category (Format)</label>
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
                            style={{ width: "100%", outline: "none", border: "1.5px solid var(--color-border-strong)", borderRadius: "12px", padding: "10px 14px" }}
                        >
                            <option value="">None</option>
                            {allSubCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                            <option value="__new__">+ Add New...</option>
                        </select>
                    </div>
                    {showNewCat && (
                        <div className="new-cat-row" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="Category name"
                                className="meta-input"
                                style={{ outline: "none", border: "1.5px solid var(--color-border-strong)", borderRadius: "12px", padding: "8px 12px", flex: 1 }}
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

                {/* 3. Color Tag Selector */}
                <div className="meta-field" style={{ minWidth: "250px" }}>
                    <label className="meta-label">Spine Color Tag</label>
                    <div className="color-picker" style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "8px" }}>
                        <button
                            onClick={() => setColorTag("")}
                            className={`color-swatch ${!colorTag ? "active" : ""}`}
                            title="None"
                            style={{
                                background: "transparent",
                                border: "1.5px dashed rgba(0,0,0,0.2)",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px"
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
                                style={{
                                    background: c.hex,
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    border: colorTag === c.hex ? "2px solid #000" : "1px solid rgba(0,0,0,0.1)",
                                    cursor: "pointer",
                                    transform: colorTag === c.hex ? "scale(1.2)" : ""
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Cover Image Upload */}
            <div className="cover-upload-section">
                <label className="meta-label">Cover Image</label>
                {coverUrl && (
                    <div className="cover-preview-wrap">
                        <img src={coverUrl} alt="Cover preview" className="cover-preview" />
                        <button
                            onClick={() => setCoverImageId("")}
                            className="btn btn-sm"
                            style={{ marginTop: 8 }}
                        >
                            Remove
                        </button>
                    </div>
                )}
                <div className="cover-upload-area">
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        disabled={uploading}
                        className="cover-file-input"
                    />
                    {uploading && (
                        <div className="cover-upload-overlay">
                            <div className="spinner" />
                            <span style={{ marginLeft: 10, fontSize: "0.8rem" }}>
                                Uploading...
                            </span>
                        </div>
                    )}
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

            {!hasChapters && (
                <Editor
                    content={content}
                    onUpdate={(html) => {
                        setContent(html);
                        triggerAutoSave(title, html);
                    }}
                />
            )}

            {hasChapters && !docId && (
                <div className="chapters-hint">
                    <p>
                        Save this writing first (type a title), then click{" "}
                        <strong>Chapters</strong> to add chapters.
                    </p>
                </div>
            )}

            {hasChapters && docId && (
                <div className="chapters-hint">
                    <p>
                        This is a <strong>{category}</strong>. Use the{" "}
                        <strong>Chapters</strong> button above to manage chapters.
                        The text area below is for the introduction/synopsis.
                    </p>
                    <Editor
                        content={content}
                        onUpdate={(html) => {
                            setContent(html);
                            triggerAutoSave(title, html);
                        }}
                        placeholder="Write an introduction or synopsis..."
                    />
                </div>
            )}
        </div>
    );
}
