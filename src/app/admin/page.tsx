"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { formatDate, isNewWriting, isRecentlyUpdated } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

export default function AdminDashboard() {
    const writings = useQuery(api.writings.listAll);
    const updateWriting = useMutation(api.writings.update);
    const removeWriting = useMutation(api.writings.remove);

    const handleTogglePublish = async (
        id: Id<"writings">,
        published: boolean
    ) => {
        await updateWriting({ id, published: !published });
    };

    const handleDelete = async (id: Id<"writings">, title: string) => {
        if (confirm(`Delete "${title}" permanently?`)) {
            await removeWriting({ id });
        }
    };

    const hasChapters = (category?: string) =>
        category === "Novel" || category === "Short Stories";

    return (
        <div>
            <h2 className="admin-heading">All Writings</h2>

            {writings === undefined && (
                <div className="loading-center">
                    <div className="spinner" />
                </div>
            )}

            {writings && writings.length === 0 && (
                <div className="empty-state" style={{ border: "1px solid #000" }}>
                    <p className="empty-subtitle" style={{ marginBottom: 16 }}>
                        No writings yet.
                    </p>
                    <Link href="/admin/write" className="btn">
                        Write Your First Piece
                    </Link>
                </div>
            )}

            {writings && writings.length > 0 && (
                <div className="admin-list">
                    {writings.map((writing) => (
                        <div key={writing._id} className="admin-item">
                            <div className="admin-item-info">
                                <div className="admin-item-title">
                                    {writing.colorTag && (
                                        <span
                                            className="color-dot"
                                            style={{ background: writing.colorTag }}
                                        />
                                    )}
                                    {writing.title || "Untitled"}
                                    <span
                                        className={`status-badge ${writing.published ? "published" : ""}`}
                                    >
                                        {writing.published ? "Published" : "Draft"}
                                    </span>
                                    {writing.category && (
                                        <span className="category-badge">{writing.category}</span>
                                    )}
                                    {isNewWriting(writing._creationTime) && (
                                        <span className="update-badge new">NEW</span>
                                    )}
                                    {!isNewWriting(writing._creationTime) &&
                                        isRecentlyUpdated(
                                            writing._creationTime,
                                            writing.updatedAt
                                        ) && <span className="update-badge updated">UPDATED</span>}
                                </div>
                                <p className="admin-item-meta">
                                    {formatDate(writing._creationTime)} &middot; /{writing.slug}
                                </p>
                            </div>
                            <div className="admin-item-actions">
                                {hasChapters(writing.category) && (
                                    <Link
                                        href={`/admin/edit/${writing._id}/chapters`}
                                        className="btn btn-sm"
                                        title="Manage chapters"
                                    >
                                        Ch
                                    </Link>
                                )}
                                <button
                                    onClick={() =>
                                        handleTogglePublish(writing._id, writing.published)
                                    }
                                    className="btn btn-sm"
                                    title={writing.published ? "Unpublish" : "Publish"}
                                >
                                    {writing.published ? "Hide" : "Pub"}
                                </button>
                                <Link
                                    href={`/admin/edit/${writing._id}`}
                                    className="btn btn-icon"
                                    title="Edit"
                                >
                                    ✎
                                </Link>
                                <button
                                    onClick={() => handleDelete(writing._id, writing.title)}
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
        </div>
    );
}
