"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import {
  formatDate,
  DEFAULT_CATEGORIES,
  isNewWriting,
  isRecentlyUpdated,
} from "@/lib/utils";
import { useState } from "react";

export default function HomePage() {
  const writings = useQuery(api.writings.listPublished);
  const signature = useQuery(api.writings.getSetting, { key: "signature" });
  const customCatsRaw = useQuery(api.writings.getSetting, {
    key: "customCategories",
  });

  const customCats: string[] = customCatsRaw
    ? JSON.parse(customCatsRaw)
    : [];
  const allCategories = [...DEFAULT_CATEGORIES, ...customCats];

  const [activeCategory, setActiveCategory] = useState("All");

  // Filter writings by category
  const filteredWritings =
    writings && activeCategory !== "All"
      ? writings.filter((w) => w.category === activeCategory)
      : writings;

  // Latest writing for the featured book
  const latest = writings && writings.length > 0 ? writings[0] : null;

  // Get only categories that have published writings
  const usedCategories = writings
    ? allCategories.filter((cat) => writings.some((w) => w.category === cat))
    : [];

  return (
    <div>
      {/* ─── HERO SECTION ─── */}
      <section className="hero">
        <h2 className="hero-heading">Stories that stay with you&nbsp;!</h2>
      </section>

      {/* ─── FEATURED SECTION ─── */}
      <section className="featured-section">
        <div className="featured-author">
          {signature && (
            <>
              <h3 className="author-name">
                <em>{signature.split(" ")[0]}</em>
                <br />
                {signature.split(" ").slice(1).join(" ")}
              </h3>
              <p className="author-role">Writer and Storyteller</p>
              <p className="featured-quote">
                &ldquo;A masterpiece of storytelling. Words that linger long
                after you&apos;ve finished reading.&rdquo;
              </p>
            </>
          )}
          {!signature && (
            <>
              <h3 className="author-name">
                <em>The</em>
                <br />
                Pen Book
              </h3>
              <p className="author-role">A space for words</p>
              <p className="featured-quote">
                &ldquo;Stories crafted with care, designed to stay with you long
                after the last word.&rdquo;
              </p>
            </>
          )}
        </div>

        {/* Clickable Latest Book */}
        <div className="featured-book">
          {latest ? (
            <Link href={`/${latest.slug}`} className="book-card-link">
              <div
                className="book-card"
                style={{
                  borderLeft: latest.colorTag
                    ? `4px solid ${latest.colorTag}`
                    : undefined,
                }}
              >
                <p className="book-card-label">Latest</p>
                <h4 className="book-card-title">{latest.title}</h4>
                {latest.category && (
                  <span className="book-card-category">
                    {latest.category}
                  </span>
                )}
                <div className="book-card-divider" />
                <p className="book-card-author">
                  {signature || "The Pen Book"}
                </p>
              </div>
            </Link>
          ) : (
            <div className="book-card">
              <p className="book-card-label">Latest</p>
              <h4 className="book-card-title">The Art of Writing</h4>
              <div className="book-card-divider" />
              <p className="book-card-author">The Pen Book</p>
            </div>
          )}
        </div>

        <div className="featured-video">
          <div className="video-placeholder">
            <div className="video-play-btn">▶</div>
          </div>
        </div>
      </section>

      {/* ─── WRITINGS LIST ─── */}
      <section className="writings-section" id="writings">
        <h3 className="writings-section-title">All Writings</h3>

        {/* Category Filter Tabs */}
        {usedCategories.length > 0 && (
          <div className="category-tabs">
            <button
              onClick={() => setActiveCategory("All")}
              className={`category-tab ${activeCategory === "All" ? "active" : ""}`}
            >
              All
            </button>
            {usedCategories.map((cat) => (
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

        {filteredWritings && filteredWritings.length === 0 && (
          <div className="empty-state">
            <h2 className="empty-title">Nothing yet.</h2>
            <p className="empty-subtitle">
              {activeCategory !== "All"
                ? `No writings in "${activeCategory}" yet.`
                : "The first words are yet to be written."}
            </p>
          </div>
        )}

        {filteredWritings &&
          filteredWritings.length > 0 &&
          filteredWritings.map((writing) => (
            <Link key={writing._id} href={`/${writing.slug}`}>
              <article className="writing-item">
                <div className="writing-item-top">
                  {writing.colorTag && (
                    <span
                      className="color-dot"
                      style={{ background: writing.colorTag }}
                    />
                  )}
                  <h2 className="writing-title">{writing.title}</h2>
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
                <div className="writing-item-bottom">
                  <time className="writing-date">
                    {formatDate(writing._creationTime)}
                  </time>
                  {writing.category && (
                    <span className="category-badge">{writing.category}</span>
                  )}
                </div>
              </article>
            </Link>
          ))}
      </section>
    </div>
  );
}
