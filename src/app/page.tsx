"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
  const writings = useQuery(api.writings.listPublished);
  const signature = useQuery(api.writings.getSetting, { key: "signature" });

  return (
    <div>
      {/* ─── HERO SECTION ─── */}
      <section className="hero">
        <h2 className="hero-heading">
          Stories that stay with you&nbsp;!
        </h2>
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
                &ldquo;Stories crafted with care, designed to stay with
                you long after the last word.&rdquo;
              </p>
            </>
          )}
        </div>

        <div className="featured-book">
          <div
            style={{
              width: 220,
              height: 300,
              background: "linear-gradient(145deg, #fef3e6, #f5e6d0)",
              borderRadius: 8,
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.85rem",
                color: "#999",
                marginBottom: 8,
              }}
            >
              Latest
            </p>
            <h4
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "1.4rem",
                fontStyle: "italic",
                lineHeight: 1.2,
                color: "#1a1a1a",
                marginBottom: 16,
              }}
            >
              {writings && writings.length > 0
                ? writings[0].title
                : "The Art of Writing"}
            </h4>
            <div
              style={{
                width: 40,
                height: 1,
                background: "#ccc",
                marginBottom: 16,
              }}
            />
            <p
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                color: "#999",
              }}
            >
              {signature || "The Pen Book"}
            </p>
          </div>
        </div>

        <div className="featured-video">
          <div
            style={{
              width: "100%",
              maxWidth: 200,
              aspectRatio: "4/3",
              background: "linear-gradient(145deg, #f0e8dd, #e8ddd0)",
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 14,
              }}
            >
              ▶
            </div>
          </div>
        </div>
      </section>

      {/* ─── WRITINGS LIST ─── */}
      <section className="writings-section" id="writings">
        <h3 className="writings-section-title">All Writings</h3>

        {writings === undefined && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {writings && writings.length === 0 && (
          <div className="empty-state">
            <h2 className="empty-title">Nothing yet.</h2>
            <p className="empty-subtitle">
              The first words are yet to be written.
            </p>
          </div>
        )}

        {writings &&
          writings.length > 0 &&
          writings.map((writing) => (
            <Link key={writing._id} href={`/${writing.slug}`}>
              <article className="writing-item">
                <h2 className="writing-title">{writing.title}</h2>
                <time className="writing-date">
                  {formatDate(writing._creationTime)}
                </time>
              </article>
            </Link>
          ))}
      </section>
    </div>
  );
}
