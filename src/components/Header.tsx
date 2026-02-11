"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function Header() {
    const logoStorageId = useQuery(api.writings.getSetting, {
        key: "logoStorageId",
    });
    const logoUrl = useQuery(
        api.writings.getFileUrl,
        logoStorageId ? { storageId: logoStorageId } : "skip"
    );

    const [mobileOpen, setMobileOpen] = useState(false);

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
            </div>
        </>
    );
}
