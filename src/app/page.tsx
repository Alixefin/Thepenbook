"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  formatDate,
  DEFAULT_CATEGORIES,
  isNewWriting,
  isRecentlyUpdated,
} from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import BookCover from "@/components/BookCover";
import CommentsCarousel from "@/components/CommentsCarousel";
import { useTheme } from "@/components/ThemeProvider";

export default function HomePage() {
  const writings = useQuery(api.writings.listPublished);
  const signature = useQuery(api.writings.getSetting, { key: "signature" });
  const writerRole = useQuery(api.writings.getSetting, { key: "writerRole" });
  const writerQuote = useQuery(api.writings.getSetting, { key: "writerQuote" });
  const customCatsRaw = useQuery(api.writings.getSetting, {
    key: "customCategories",
  });

  const customCats: string[] = customCatsRaw
    ? JSON.parse(customCatsRaw)
    : [];
  const allCategories = [...DEFAULT_CATEGORIES, ...customCats];

  const dayCategories = useQuery(api.writings.getAllDayCategories) || [];
  const activeDayCategories = dayCategories.filter(d => d.active);

  const { theme } = useTheme();

  const [activeCategory, setActiveCategory] = useState("All");

  // Listen for category selection from header nav
  useEffect(() => {
    const handler = (e: Event) => {
      const cat = (e as CustomEvent).detail;
      setActiveCategory(cat);
      document.getElementById("writings")?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("selectCategory", handler);
    return () => window.removeEventListener("selectCategory", handler);
  }, []);

  // Parse category from URL query parameter on initial load if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("cat");
      if (catParam) {
        setActiveCategory(catParam);
        // Wait briefly for content to render, then scroll to section
        setTimeout(() => {
          document.getElementById("writings")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  // Get used day categories to display as filter tabs
  const combinedCategories = writings
    ? activeDayCategories
        .filter((day) => writings.some((w) => w.dayPostedOn === day.day))
        .map((day) => day.name)
    : [];

  // Latest overall
  const latest = writings && writings.length > 0 ? writings[0] : null;

  // Filter day categories to display based on the active tab
  const displayedDayCategories = activeCategory === "All"
    ? activeDayCategories.filter((day) => writings && writings.some((w) => w.dayPostedOn === day.day))
    : activeDayCategories.filter((day) => day.name === activeCategory);

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="hero">
        <h2 className="hero-heading">
          {theme?.heroHeadline || "Stories that stay with you\u00A0!"}
        </h2>
      </section>

      {/* ─── FEATURED SECTION ─── */}
      <section className="featured-section">
        <div className="featured-author">
          {signature ? (
            <>
              <h3 className="author-name">
                <em>{signature.split(" ")[0]}</em>
                <br />
                {signature.split(" ").slice(1).join(" ")}
              </h3>
              <p className="author-role">{writerRole || "Writer and Storyteller"}</p>
              <p className="featured-quote">
                &ldquo;{writerQuote || "Stories crafted with care, designed to stay with you long after the last word."}&rdquo;
              </p>
            </>
          ) : (
            <>
              <h3 className="author-name">
                <em>The</em>
                <br />
                Pen Book
              </h3>
              <p className="author-role">{writerRole || "A space for words"}</p>
              <p className="featured-quote">
                &ldquo;{writerQuote || "Stories crafted with care, designed to stay with you long after the last word."}&rdquo;
              </p>
            </>
          )}
        </div>

        {/* ─── BOOK DISPLAY: single latest book cover ─── */}
        <div className="featured-books-area">
          {latest ? (
            <div className="featured-main-book">
              <BookCover
                id={latest._id}
                slug={latest.slug}
                title={latest.title}
                coverImageId={latest.coverImageId}
                colorTag={latest.colorTag}
                category={latest.category}
                size="large"
                className="book-card-link"
              />
            </div>
          ) : (
            <div className="featured-main-book">
              <div className="book-cover book-cover-lg">
                <div className="book-cover-spine" />
                <div className="book-cover-content">
                  <div className="book-cover-placeholder-lg">
                    <div className="book-cover-placeholder-text">
                      <p className="book-cover-label">Latest</p>
                    </div>
                  </div>
                  <div className="book-cover-footer">
                    <h3 className="book-cover-title-lg">The Art of Writing</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── WRITINGS LIST ─── */}
      <section className="writings-section" id="writings">
        <h3 className="writings-section-title">All Writings</h3>

        {/* Category Filter Tabs */}
        {combinedCategories.length > 0 && (
          <div className="category-tabs">
            <button
              onClick={() => setActiveCategory("All")}
              className={`category-tab ${activeCategory === "All" ? "active" : ""}`}
            >
              All
            </button>
            {combinedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`category-tab ${activeCategory === cat ? "active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {writings === undefined && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {writings && writings.length === 0 && (
          <div className="empty-state">
            <h2 className="empty-title">Nothing yet.</h2>
            <p className="empty-subtitle">The first words are yet to be written.</p>
          </div>
        )}

        {writings && displayedDayCategories.map((day) => {
          const dayWritings = writings.filter((w) => w.dayPostedOn === day.day);
          if (dayWritings.length === 0) return null;

          return (
            <div key={day.day} className="day-theme-section" style={{ '--day-color': day.hexColor } as React.CSSProperties}>
              <div className="day-theme-section-header">
                <span className="day-theme-indicator" style={{ backgroundColor: day.hexColor }}></span>
                <h4 className="day-theme-title">{day.name}</h4>
                <span className="day-theme-tagline">{day.heroHeadline}</span>
              </div>
              
              <div className="writings-grid">
                {dayWritings.map((writing) => (
                  <div key={writing._id} className="writings-grid-item">
                    <BookCover
                      id={writing._id}
                      slug={writing.slug}
                      title={writing.title}
                      coverImageId={writing.coverImageId}
                      colorTag={writing.colorTag}
                      category={writing.category}
                      size="large"
                    />
                    <div className="writings-grid-meta">
                      {writing.category && (
                        <span className="writing-genre-badge">{writing.category}</span>
                      )}
                      <time className="writing-date">
                        {formatDate(writing._creationTime)}
                      </time>
                      {(writing.viewCount ?? 0) > 0 && (
                        <span className="view-count">
                          👁 {writing.viewCount} reads
                        </span>
                      )}
                      {isNewWriting(writing._creationTime) && (
                        <span className="update-badge new">NEW</span>
                      )}
                      {!isNewWriting(writing._creationTime) &&
                        isRecentlyUpdated(
                          writing._creationTime,
                          writing.updatedAt
                        ) && (
                          <span className="update-badge updated">UPDATED</span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── READER COMMENTS CAROUSEL ─── */}
      <CommentsCarousel />
    </div>
  );
}
