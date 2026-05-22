"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

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
 * BookCover component displays a writing as a professional book cover
 * with spine color, optional cover image, and theme-aware styling
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
        <div className="book-cover-content">
          {/* Cover image if available */}
          {coverImageId ? (
            <CoverImage
              storageId={coverImageId}
              className={`book-cover-image ${size === "large" ? "book-cover-image-lg" : "book-cover-image-sm"}`}
            />
          ) : (
            <div className={`book-cover-placeholder ${size === "large" ? "book-cover-placeholder-lg" : "book-cover-placeholder-sm"}`}>
              <div className="book-cover-placeholder-text">
                <p className="book-cover-label">Latest</p>
              </div>
            </div>
          )}

          {/* Title and metadata */}
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

        {/* Hover overlay for interactivity hint */}
        <div className="book-cover-overlay" aria-hidden="true" />
      </div>
    </Link>
  );
}
