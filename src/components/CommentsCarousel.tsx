"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

/**
 * CommentsCarousel - displays recent reader comments as a horizontal carousel
 * with auto-advance and hover pause
 */
export default function CommentsCarousel() {
  const comments = useQuery(api.writings.getRecentComments, { limit: 10 });
  const [activeIndex, setActiveIndex] = useState(0);
  const autoTimer = useRef<NodeJS.Timeout | null>(null);
  const hoveringRef = useRef(false);

  // Auto-advance carousel
  const advanceCarousel = useCallback(() => {
    if (hoveringRef.current || !comments || comments.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % comments.length);
  }, [comments]);

  useEffect(() => {
    if (!comments || comments.length <= 1) return;
    autoTimer.current = setInterval(advanceCarousel, 6000);
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [advanceCarousel, comments]);

  if (!comments || comments.length === 0) {
    return null;
  }

  const currentComment = comments[activeIndex];

  const goPrev = () => {
    setActiveIndex((i) => (i === 0 ? comments.length - 1 : i - 1));
  };

  const goNext = () => {
    setActiveIndex((i) => (i + 1) % comments.length);
  };

  return (
    <section className="comments-carousel-section">
      <div className="comments-carousel-header">
        <h2 className="comments-carousel-title">What Readers Are Saying</h2>
      </div>

      <div
        className="comments-carousel-container"
        onMouseEnter={() => {
          hoveringRef.current = true;
        }}
        onMouseLeave={() => {
          hoveringRef.current = false;
        }}
      >
        {comments.length > 1 && (
          <button onClick={goPrev} className="comments-carousel-arrow left" aria-label="Previous comment">
            ‹
          </button>
        )}

        {currentComment && (
          <Link href={`/${currentComment.writingSlug}`} className="comments-carousel-card-link">
            <div className="comments-carousel-card">
              <div className="comments-carousel-quote-mark">"</div>
              <p className="comments-carousel-text">
                {currentComment.text.length > 160 ? (
                  <>
                    {currentComment.text.substring(0, 160)}...{" "}
                    <span className="comments-carousel-continue">continue to read ➔</span>
                  </>
                ) : (
                  currentComment.text
                )}
              </p>
              <div className="comments-carousel-footer">
                <span className="comments-carousel-author">{currentComment.name}</span>
                <span className="comments-carousel-writing-title">
                  on <em>{currentComment.writingTitle}</em>
                </span>
              </div>
            </div>
          </Link>
        )}

        {comments.length > 1 && (
          <button onClick={goNext} className="comments-carousel-arrow right" aria-label="Next comment">
            ›
          </button>
        )}

        {/* Carousel dots */}
        {comments.length > 1 && (
          <div className="comments-carousel-dots">
            {comments.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`comments-carousel-dot ${i === activeIndex ? "active" : ""}`}
                aria-label={`Go to comment ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
