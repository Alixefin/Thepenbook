"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Suspense } from "react";

function CoverImage({ storageId }: { storageId: string }) {
    const url = useQuery(api.writings.getFileUrl, { storageId });
    if (!url) return null;
    return <img src={url} alt="Cover" className="reading-cover" />;
}

function ReadingContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const chParam = searchParams.get("ch");
    const chapterNumber = chParam ? parseInt(chParam, 10) : null;

    const writing = useQuery(api.writings.getBySlug, { slug });
    const signature = useQuery(api.writings.getSetting, { key: "signature" });

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
        ? chapters.filter((ch) => ch.published)
        : [];

    // Viewing a chapter
    if (chapterNumber && currentChapter) {
        const prevCh =
            chapterNumber > 1
                ? publishedChapters.find((c) => c.chapterNumber === chapterNumber - 1)
                : null;
        const nextCh = publishedChapters.find(
            (c) => c.chapterNumber === chapterNumber + 1
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
                    <p className="empty-subtitle">
                        This chapter does not exist yet.
                    </p>
                </div>
            </div>
        );
    }

    // Main writing view (overview + table of contents)
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
                <time className="reading-meta" style={{ border: "none", padding: 0, margin: 0 }}>
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
                        {publishedChapters.map((ch) => (
                            <Link
                                key={ch._id}
                                href={`/${slug}?ch=${ch.chapterNumber}`}
                                className="toc-item"
                            >
                                <span className="toc-number">{ch.chapterNumber}</span>
                                <span className="toc-title">{ch.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {hasChapters && publishedChapters.length === 0 && chapters !== undefined && (
                <div className="toc-section">
                    <p className="empty-subtitle">
                        Chapters coming soon.
                    </p>
                </div>
            )}

            {signature && (
                <div className="writing-signature">
                    <span className="signature-text">— {signature}</span>
                </div>
            )}
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
