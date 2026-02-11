"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function ChaptersPage() {
    const router = useRouter();
    const params = useParams();
    const writingId = params.id as string;

    const writing = useQuery(api.writings.getById, {
        id: writingId as Id<"writings">,
    });
    const chapters = useQuery(api.writings.listChapters, {
        writingId: writingId as Id<"writings">,
    });
    const createChapter = useMutation(api.writings.createChapter);
    const updateChapter = useMutation(api.writings.updateChapter);
    const removeChapter = useMutation(api.writings.removeChapter);

    const [editingId, setEditingId] = useState<Id<"chapters"> | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editPublished, setEditPublished] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isNew, setIsNew] = useState(false);

    // Open editor for existing chapter
    const openChapter = (ch: {
        _id: Id<"chapters">;
        title: string;
        content: string;
        published: boolean;
    }) => {
        setEditingId(ch._id);
        setEditTitle(ch.title);
        setEditContent(ch.content);
        setEditPublished(ch.published);
        setIsNew(false);
    };

    // Start new chapter
    const startNewChapter = () => {
        const nextNum = chapters ? chapters.length + 1 : 1;
        setEditingId(null);
        setEditTitle(`Chapter ${nextNum}`);
        setEditContent("");
        setEditPublished(true);
        setIsNew(true);
    };

    const handleSaveChapter = async () => {
        setSaving(true);
        try {
            if (isNew) {
                const nextNum = chapters ? chapters.length + 1 : 1;
                await createChapter({
                    writingId: writingId as Id<"writings">,
                    title: editTitle,
                    content: editContent,
                    chapterNumber: nextNum,
                    published: editPublished,
                });
            } else if (editingId) {
                await updateChapter({
                    id: editingId,
                    title: editTitle,
                    content: editContent,
                    published: editPublished,
                });
            }
            // Close editor
            setEditingId(null);
            setIsNew(false);
        } catch (err) {
            console.error("Save chapter failed:", err);
        }
        setSaving(false);
    };

    const handleDeleteChapter = async (id: Id<"chapters">, title: string) => {
        if (confirm(`Delete chapter "${title}"?`)) {
            await removeChapter({ id });
            if (editingId === id) {
                setEditingId(null);
                setIsNew(false);
            }
        }
    };

    const handleMoveChapter = async (
        ch: { _id: Id<"chapters">; chapterNumber: number },
        direction: "up" | "down"
    ) => {
        if (!chapters) return;
        const targetNum =
            direction === "up" ? ch.chapterNumber - 1 : ch.chapterNumber + 1;
        if (targetNum < 1 || targetNum > chapters.length) return;

        const swapWith = chapters.find((c) => c.chapterNumber === targetNum);
        if (!swapWith) return;

        await updateChapter({
            id: ch._id,
            chapterNumber: targetNum,
        });
        await updateChapter({
            id: swapWith._id,
            chapterNumber: ch.chapterNumber,
        });
    };

    if (writing === undefined || chapters === undefined) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    if (writing === null) {
        return (
            <div className="empty-state">
                <h2 className="empty-title">Writing not found.</h2>
                <br />
                <button onClick={() => router.push("/admin")} className="btn">
                    Back
                </button>
            </div>
        );
    }

    const isEditing = editingId !== null || isNew;

    return (
        <div>
            <div className="write-header">
                <div className="write-header-left">
                    <h2 className="write-heading">
                        Chapters — <em>{writing.title}</em>
                    </h2>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => router.push(`/admin/edit/${writingId}`)}
                        className="btn btn-sm"
                    >
                        ← Back to Edit
                    </button>
                    {!isEditing && (
                        <button onClick={startNewChapter} className="btn">
                            + Add Chapter
                        </button>
                    )}
                </div>
            </div>

            {/* Chapter list */}
            {!isEditing && chapters.length === 0 && (
                <div className="empty-state" style={{ border: "1px solid #000" }}>
                    <p className="empty-subtitle" style={{ marginBottom: 16 }}>
                        No chapters yet.
                    </p>
                    <button onClick={startNewChapter} className="btn">
                        Add First Chapter
                    </button>
                </div>
            )}

            {!isEditing && chapters.length > 0 && (
                <div className="admin-list">
                    {chapters.map((ch) => (
                        <div key={ch._id} className="admin-item">
                            <div className="admin-item-info">
                                <div className="admin-item-title">
                                    <span className="chapter-number">
                                        Ch. {ch.chapterNumber}
                                    </span>
                                    {ch.title}
                                    <span
                                        className={`status-badge ${ch.published ? "published" : ""}`}
                                    >
                                        {ch.published ? "Published" : "Draft"}
                                    </span>
                                </div>
                            </div>
                            <div className="admin-item-actions">
                                <button
                                    onClick={() => handleMoveChapter(ch, "up")}
                                    disabled={ch.chapterNumber === 1}
                                    className="btn btn-icon"
                                    title="Move up"
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => handleMoveChapter(ch, "down")}
                                    disabled={ch.chapterNumber === chapters.length}
                                    className="btn btn-icon"
                                    title="Move down"
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => openChapter(ch)}
                                    className="btn btn-icon"
                                    title="Edit"
                                >
                                    ✎
                                </button>
                                <button
                                    onClick={() => handleDeleteChapter(ch._id, ch.title)}
                                    className="btn btn-icon"
                                    title="Delete"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Chapter editor */}
            {isEditing && (
                <div className="chapter-editor">
                    <div className="meta-row">
                        <div className="meta-field" style={{ flex: 2 }}>
                            <label className="meta-label">Chapter Title</label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Chapter title"
                                className="meta-input"
                                autoFocus
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div className="meta-field" style={{ flex: 0, minWidth: 100 }}>
                            <label className="meta-label">Status</label>
                            <select
                                value={editPublished ? "published" : "draft"}
                                onChange={(e) =>
                                    setEditPublished(e.target.value === "published")
                                }
                                className="meta-select"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    <Editor
                        content={editContent}
                        onUpdate={(html) => setEditContent(html)}
                        placeholder="Write your chapter..."
                    />

                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 16,
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setIsNew(false);
                            }}
                            className="btn btn-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveChapter}
                            disabled={saving || !editTitle.trim()}
                            className="btn"
                        >
                            {saving ? "Saving..." : isNew ? "Create Chapter" : "Save Changes"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
