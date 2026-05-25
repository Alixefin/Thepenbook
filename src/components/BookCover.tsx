"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import DynamicCoverArt from "./DynamicCoverArt";

interface BookCoverProps {
    id: string;
    slug: string;
    title: string;
    coverImageId?: string;
    colorTag?: string;
    category?: string;
    size?: "large" | "small";
    className?: string;
}

function CoverImage({
    storageId,
    className,
}: {
    storageId: string;
    className?: string;
}) {
    const url = useQuery(api.writings.getFileUrl, { storageId });
    if (!url) return null;
    return <img src={url} alt="" className={className} />;
}

/**
 * BookCover displays a writing as a professional book cover.
 * - If a cover image is uploaded → shows the image.
 * - If no cover image → renders a unique SVG generated from the title/category/color.
 */
export default function BookCover({
    id,
    slug,
    title,
    coverImageId,
    colorTag,
    category,
    size = "large",
    className = "",
}: BookCoverProps) {
    const sizeClasses = {
        large: "book-cover-lg",
        small: "book-cover-sm",
    };

    return (
        <Link href={`/${slug}`} className={`book-cover-link ${className}`}>
            <div className={`book-cover ${sizeClasses[size]}`}>

                {/* Book spine (left border with color tag) */}
                {colorTag && (
                    <div
                        className="book-cover-spine"
                        style={{ backgroundColor: colorTag }}
                        aria-hidden="true"
                    />
                )}

                {/* Main content area */}
                {coverImageId ? (
                    /* Uploaded cover image layout */
                    <div className="book-cover-content">
                        <CoverImage
                            storageId={coverImageId}
                            className={`book-cover-image ${size === "large" ? "book-cover-image-lg" : "book-cover-image-sm"}`}
                        />
                        <div className="book-cover-footer">
                            <h3 className={`book-cover-title ${size === "large" ? "book-cover-title-lg" : "book-cover-title-sm"}`}>
                                {title}
                            </h3>
                            {category && (
                                <span className={`book-cover-category ${size === "large" ? "book-cover-category-lg" : "book-cover-category-sm"}`}>
                                    {category}
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Dynamic SVG cover art — unique for every title */
                    <div className="book-cover-dynamic-wrap">
                        <DynamicCoverArt
                            title={title}
                            category={category}
                            colorTag={colorTag}
                            size={size}
                        />
                    </div>
                )}

                {/* Hover overlay for interactivity hint */}
                <div className="book-cover-overlay" aria-hidden="true" />
            </div>
        </Link>
    );
}
