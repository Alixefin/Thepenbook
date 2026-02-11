"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function ReadingPage() {
    const params = useParams();
    const slug = params.slug as string;
    const writing = useQuery(api.writings.getBySlug, { slug });
    const signature = useQuery(api.writings.getSetting, { key: "signature" });

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

    return (
        <div className="reading-container">
            <Link href="/" className="back-link">
                ← Back
            </Link>

            <h1 className="reading-title">{writing.title}</h1>

            <div className="reading-meta-row">
                <time className="reading-meta">
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

            <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: writing.content }}
            />

            {signature && (
                <div className="writing-signature">
                    <span className="signature-text">— {signature}</span>
                </div>
            )}
        </div>
    );
}
