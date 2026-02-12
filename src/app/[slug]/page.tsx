"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Suspense, useEffect, useRef, useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";

function CoverImage({ storageId }: { storageId: string }) {
    const url = useQuery(api.writings.getFileUrl, { storageId });
    if (!url) return null;
    return <img src={url} alt="Cover" className="reading-cover" />;
}

/* ── Comments Section ── */
function CommentsSection({ writingId }: { writingId: Id<"writings"> }) {
    const comments = useQuery(api.writings.listComments, { writingId });
    const addComment = useMutation(api.writings.addComment);
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !text.trim()) return;
        setSubmitting(true);
        try {
            await addComment({ writingId, name: name.trim(), text: text.trim() });
            setName("");
            setText("");
        } catch (err) {
            console.error("Failed to post comment:", err);
        }
        setSubmitting(false);
    };

    return (
        <div className="comments-section">
            <h3 className="comments-heading">
                Comments{" "}
                {comments && comments.length > 0 && (
                    <span className="comments-count">{comments.length}</span>
                )}
            </h3>

            {/* Comment form */}
            <form onSubmit={handleSubmit} className="comment-form">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="comment-input"
                    required
                />
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a comment..."
                    className="comment-textarea"
                    rows={3}
                    required
                />
                <button
                    type="submit"
                    disabled={submitting || !name.trim() || !text.trim()}
                    className="btn"
                >
                    {submitting ? "Posting..." : "Post Comment"}
                </button>
            </form>

            {/* Comments list */}
            {comments && comments.length === 0 && (
                <p className="comments-empty">
                    No comments yet. Be the first to share your thoughts!
                </p>
            )}

            {comments &&
                comments.length > 0 &&
                comments.map((c) => (
                    <div key={c._id} className="comment-item">
                        <div className="comment-header">
                            <span className="comment-author">{c.name}</span>
                            <time className="comment-time">
                                {formatDate(c._creationTime)}
                            </time>
                        </div>
                        <p className="comment-text">{c.text}</p>
                    </div>
                ))}
        </div>
    );
}

function ReadingContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const chParam = searchParams.get("ch");
    const chapterNumber = chParam ? parseInt(chParam, 10) : null;

    const writing = useQuery(api.writings.getBySlug, { slug });
    const signature = useQuery(api.writings.getSetting, { key: "signature" });
    const recordView = useMutation(api.writings.recordView);
    const viewRecorded = useRef(false);

    // Record view once
    useEffect(() => {
        if (writing && !viewRecorded.current) {
            viewRecorded.current = true;
            recordView({ id: writing._id });
        }
    }, [writing, recordView]);

    // Check if this writing supports chapters
    const hasChapters =
        writing?.category === "Novel" || writing?.category === "Short Stories";

    const chapters = useQuery(
        api.writings.listChapters,
        writing && hasChapters ? { writingId: writing._id } : "skip"
    );

    // If viewing a specific chapter
    const currentChapter = useQuery(
        api.writings.getChapter,
        writing && chapterNumber
            ? { writingId: writing._id, chapterNumber }
            : "skip"
    );

    if (writing === undefined) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    if (writing === null) {
        return (
            <div className="empty-state">
                <h2 className="empty-title">Not Found</h2>
                <p className="empty-subtitle">
                    This writing does not exist or has been removed.
                </p>
                <br />
                <Link href="/" className="btn">
                    Go Back
                </Link>
            </div>
        );
    }

    // Published chapters only
    const publishedChapters = chapters
        ? chapters.filter((ch: { published: boolean }) => ch.published)
        : [];

    // Viewing a chapter
    if (chapterNumber && currentChapter) {
        const prevCh =
            chapterNumber > 1
                ? publishedChapters.find(
                    (c: { chapterNumber: number }) =>
                        c.chapterNumber === chapterNumber - 1
                )
                : null;
        const nextCh = publishedChapters.find(
            (c: { chapterNumber: number }) =>
                c.chapterNumber === chapterNumber + 1
        );

        return (
            <div className="reading-container">
                <Link href={`/${slug}`} className="back-link">
                    ← {writing.title}
                </Link>

                <h1 className="reading-title">
                    <span className="chapter-label">Chapter {chapterNumber}</span>
                    {currentChapter.title}
                </h1>

                <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: currentChapter.content }}
                />

                {/* Chapter navigation */}
                <div className="chapter-nav">
                    {prevCh ? (
                        <Link
                            href={`/${slug}?ch=${chapterNumber - 1}`}
                            className="btn chapter-nav-btn"
                        >
                            ← Previous
                        </Link>
                    ) : (
                        <span />
                    )}
                    {nextCh ? (
                        <Link
                            href={`/${slug}?ch=${chapterNumber + 1}`}
                            className="btn chapter-nav-btn"
                        >
                            Next →
                        </Link>
                    ) : (
                        <span />
                    )}
                </div>

                {signature && (
                    <div className="writing-signature">
                        <span className="signature-text">— {signature}</span>
                    </div>
                )}

                {/* Comments under chapter too */}
                <CommentsSection writingId={writing._id} />
            </div>
        );
    }

    // Loading chapter
    if (chapterNumber && currentChapter === undefined) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    // Chapter not found
    if (chapterNumber && currentChapter === null) {
        return (
            <div className="reading-container">
                <Link href={`/${slug}`} className="back-link">
                    ← {writing.title}
                </Link>
                <div className="empty-state">
                    <h2 className="empty-title">Chapter Not Found</h2>
                    <p className="empty-subtitle">This chapter does not exist yet.</p>
                </div>
            </div>
        );
    }

    // Main writing view
    return (
        <div className="reading-container">
            <Link href="/" className="back-link">
                ← Back
            </Link>

            {/* Cover image */}
            {writing.coverImageId && (
                <CoverImage storageId={writing.coverImageId} />
            )}

            <h1 className="reading-title">{writing.title}</h1>

            <div className="reading-meta-row">
                <time
                    className="reading-meta"
                    style={{ border: "none", padding: 0, margin: 0 }}
                >
                    {formatDate(writing._creationTime)}
                </time>
                {writing.category && (
                    <span className="category-badge">{writing.category}</span>
                )}
                {writing.colorTag && (
                    <span
                        className="color-dot"
                        style={{ background: writing.colorTag }}
                    />
                )}
                <span className="view-count">👁 {writing.viewCount || 0} reads</span>
            </div>

            {/* Synopsis / content */}
            {writing.content && (
                <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: writing.content }}
                />
            )}

            {/* Table of Contents for chapter-based writings */}
            {hasChapters && publishedChapters.length > 0 && (
                <div className="toc-section">
                    <h3 className="toc-heading">Chapters</h3>
                    <div className="toc-list">
                        {publishedChapters.map(
                            (ch: {
                                _id: string;
                                chapterNumber: number;
                                title: string;
                            }) => (
                                <Link
                                    key={ch._id}
                                    href={`/${slug}?ch=${ch.chapterNumber}`}
                                    className="toc-item"
                                >
                                    <span className="toc-number">{ch.chapterNumber}</span>
                                    <span className="toc-title">{ch.title}</span>
                                </Link>
                            )
                        )}
                    </div>
                </div>
            )}

            {hasChapters &&
                publishedChapters.length === 0 &&
                chapters !== undefined && (
                    <div className="toc-section">
                        <p className="empty-subtitle">Chapters coming soon.</p>
                    </div>
                )}

            {signature && (
                <div className="writing-signature">
                    <span className="signature-text">— {signature}</span>
                </div>
            )}

            {/* Comments */}
            <CommentsSection writingId={writing._id} />
        </div>
    );
}

export default function ReadingPage() {
    return (
        <Suspense
            fallback={
                <div className="loading-center">
                    <div className="spinner" />
                </div>
            }
        >
            <ReadingContent />
        </Suspense>
    );
}
