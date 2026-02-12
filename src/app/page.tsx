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
import { useState, useEffect, useCallback, useRef } from "react";

/* ── tiny component to fetch a cover URL ── */
function CoverImage({
  storageId,
  className,
}: {
  storageId: string;
  className?: string;
}) {
  const url = useQuery(api.writings.getFileUrl, { storageId });
  if (!url) return null;
  return <img src={url} alt="" className={className || "book-card-cover"} />;
}

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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const autoTimer = useRef<NodeJS.Timeout | null>(null);
  const hoveringRef = useRef(false);

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

  // Filter writings by category
  const filteredWritings =
    writings && activeCategory !== "All"
      ? writings.filter((w) => w.category === activeCategory)
      : writings;

  // Get used categories
  const usedCategories = writings
    ? allCategories.filter((cat) => writings.some((w) => w.category === cat))
    : [];

  // Build carousel cards: one per used category (latest published)
  const carouselCards = writings
    ? usedCategories
      .map((cat) => {
        const latest = writings.find((w) => w.category === cat);
        return latest ? { ...latest, _cat: cat } : null;
      })
      .filter(Boolean) as (typeof writings extends (infer U)[] | undefined
        ? U & { _cat: string }
        : never)[]
    : [];

  // Latest overall
  const latest = writings && writings.length > 0 ? writings[0] : null;
  // Previous books (after latest, up to 3)
  const previousBooks = writings ? writings.slice(1, 4) : [];

  // Bound carousel index
  useEffect(() => {
    if (carouselCards.length > 0 && carouselIndex >= carouselCards.length) {
      setCarouselIndex(0);
    }
  }, [carouselCards.length, carouselIndex]);

  // Auto-advance carousel
  const advanceCarousel = useCallback(() => {
    if (hoveringRef.current) return;
    setCarouselIndex((prev) =>
      carouselCards.length > 0 ? (prev + 1) % carouselCards.length : 0
    );
  }, [carouselCards.length]);

  useEffect(() => {
    if (carouselCards.length <= 1) return;
    autoTimer.current = setInterval(advanceCarousel, 5000);
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [advanceCarousel, carouselCards.length]);

  const goPrev = () =>
    setCarouselIndex((i) =>
      i === 0 ? carouselCards.length - 1 : i - 1
    );
  const goNext = () =>
    setCarouselIndex((i) => (i + 1) % carouselCards.length);

  return (
    <div>
      {/* ─── HERO ─── */}
      <section className="hero">
        <h2 className="hero-heading">Stories that stay with you&nbsp;!</h2>
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
              <p className="author-role">Writer and Storyteller</p>
              <p className="featured-quote">
                &ldquo;A masterpiece of storytelling. Words that linger long
                after you&apos;ve finished reading.&rdquo;
              </p>
            </>
          ) : (
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

        {/* ─── BOOK DISPLAY: latest big + previous small ─── */}
        <div
          className="featured-books-area"
          onMouseEnter={() => {
            hoveringRef.current = true;
          }}
          onMouseLeave={() => {
            hoveringRef.current = false;
          }}
        >
          {/* Main latest card (large) */}
          {carouselCards.length > 0 ? (
            <div className="featured-main-book">
              <div className="carousel-container">
                {carouselCards.length > 1 && (
                  <button onClick={goPrev} className="carousel-arrow left">
                    ‹
                  </button>
                )}

                <Link
                  href={`/${carouselCards[carouselIndex]?.slug}`}
                  className="book-card-link"
                  key={carouselCards[carouselIndex]?._id}
                >
                  <div
                    className="book-card book-card-large"
                    style={{
                      borderLeft: carouselCards[carouselIndex]?.colorTag
                        ? `4px solid ${carouselCards[carouselIndex].colorTag}`
                        : undefined,
                    }}
                  >
                    {carouselCards[carouselIndex]?.coverImageId ? (
                      <CoverImage
                        storageId={carouselCards[carouselIndex].coverImageId!}
                        className="book-card-cover-large"
                      />
                    ) : (
                      <>
                        <p className="book-card-label">Latest</p>
                        <h4 className="book-card-title">
                          {carouselCards[carouselIndex]?.title}
                        </h4>
                      </>
                    )}
                    {carouselCards[carouselIndex]?.category && (
                      <span className="book-card-category">
                        {carouselCards[carouselIndex].category}
                      </span>
                    )}
                    <div className="book-card-divider" />
                    <p className="book-card-author">
                      {signature || "The Pen Book"}
                    </p>
                  </div>
                </Link>

                {carouselCards.length > 1 && (
                  <button onClick={goNext} className="carousel-arrow right">
                    ›
                  </button>
                )}

                {carouselCards.length > 1 && (
                  <div className="carousel-dots">
                    {carouselCards.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIndex(i)}
                        className={`carousel-dot ${i === carouselIndex ? "active" : ""}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : latest ? (
            <div className="featured-main-book">
              <Link href={`/${latest.slug}`} className="book-card-link">
                <div
                  className="book-card book-card-large"
                  style={{
                    borderLeft: latest.colorTag
                      ? `4px solid ${latest.colorTag}`
                      : undefined,
                  }}
                >
                  {latest.coverImageId ? (
                    <CoverImage
                      storageId={latest.coverImageId}
                      className="book-card-cover-large"
                    />
                  ) : (
                    <>
                      <p className="book-card-label">Latest</p>
                      <h4 className="book-card-title">{latest.title}</h4>
                    </>
                  )}
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
            </div>
          ) : (
            <div className="featured-main-book">
              <div className="book-card book-card-large">
                <p className="book-card-label">Latest</p>
                <h4 className="book-card-title">The Art of Writing</h4>
                <div className="book-card-divider" />
                <p className="book-card-author">The Pen Book</p>
              </div>
            </div>
          )}

          {/* Previous books (smaller, beside the main) */}
          {previousBooks.length > 0 && (
            <div className="featured-side-books">
              {previousBooks.map((book) => (
                <Link
                  key={book._id}
                  href={`/${book.slug}`}
                  className="book-card-link"
                >
                  <div
                    className="book-card book-card-small"
                    style={{
                      borderLeft: book.colorTag
                        ? `3px solid ${book.colorTag}`
                        : undefined,
                    }}
                  >
                    {book.coverImageId ? (
                      <CoverImage
                        storageId={book.coverImageId}
                        className="book-card-cover-small"
                      />
                    ) : (
                      <h4 className="book-card-title-sm">{book.title}</h4>
                    )}
                    {book.category && (
                      <span className="book-card-category-sm">
                        {book.category}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
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
                  {(writing.viewCount ?? 0) > 0 && (
                    <span className="view-count">
                      👁 {writing.viewCount}
                    </span>
                  )}
                </div>
              </article>
            </Link>
          ))}
      </section>
    </div>
  );
}
