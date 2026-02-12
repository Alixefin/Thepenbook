"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { DEFAULT_CATEGORIES } from "@/lib/utils";

export default function Header() {
    const logoStorageId = useQuery(api.writings.getSetting, {
        key: "logoStorageId",
    });
    const logoUrl = useQuery(
        api.writings.getFileUrl,
        logoStorageId ? { storageId: logoStorageId } : "skip"
    );
    const customCatsRaw = useQuery(api.writings.getSetting, {
        key: "customCategories",
    });
    const customCats: string[] = customCatsRaw
        ? JSON.parse(customCatsRaw)
        : [];
    const allCategories = [...DEFAULT_CATEGORIES, ...customCats];

    const [mobileOpen, setMobileOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);

    return (
        <>
            <header className="site-header">
                {/* Logo */}
                <Link href="/" className="header-logo-area">
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt="The Pen Book"
                            className="header-logo-img"
                        />
                    )}
                    <div>
                        <div className="header-logo-text">The Pen</div>
                        <div className="header-logo-sub">B O O K</div>
                    </div>
                </Link>

                {/* Desktop nav */}
                <nav className="header-nav">
                    <Link href="/">Home</Link>
                    <Link href="/#writings">All Writings</Link>
                    {/* Categories dropdown */}
                    <div
                        className="nav-dropdown"
                        onMouseEnter={() => setCatOpen(true)}
                        onMouseLeave={() => setCatOpen(false)}
                    >
                        <button className="nav-dropdown-trigger">
                            Categories <span className="dropdown-chevron">▾</span>
                        </button>
                        {catOpen && (
                            <div className="nav-dropdown-menu">
                                {allCategories.map((cat) => (
                                    <Link
                                        key={cat}
                                        href={`/#writings?cat=${encodeURIComponent(cat)}`}
                                        onClick={() => {
                                            setCatOpen(false);
                                            // Dispatch a custom event so the homepage can react
                                            window.dispatchEvent(
                                                new CustomEvent("selectCategory", { detail: cat })
                                            );
                                        }}
                                    >
                                        {cat}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Right side - mobile menu only */}
                <div className="header-right">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </header>

            {/* Mobile nav overlay */}
            <div className={`mobile-nav-overlay ${mobileOpen ? "open" : ""}`}>
                <button
                    className="mobile-nav-close"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                >
                    ×
                </button>
                <Link href="/" onClick={() => setMobileOpen(false)}>
                    Home
                </Link>
                <Link href="/#writings" onClick={() => setMobileOpen(false)}>
                    All Writings
                </Link>
                {/* Mobile categories list */}
                <div className="mobile-cat-heading">Categories</div>
                {allCategories.map((cat) => (
                    <Link
                        key={cat}
                        href={`/#writings`}
                        className="mobile-cat-link"
                        onClick={() => {
                            setMobileOpen(false);
                            setTimeout(() => {
                                window.dispatchEvent(
                                    new CustomEvent("selectCategory", { detail: cat })
                                );
                            }, 100);
                        }}
                    >
                        {cat}
                    </Link>
                ))}
            </div>
        </>
    );
}
