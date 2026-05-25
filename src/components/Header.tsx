"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { DEFAULT_CATEGORIES } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

import NotificationCenter from "./NotificationCenter";

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

    const dayCategories = useQuery(api.writings.getAllDayCategories) || [];
    const activeDayCategories = dayCategories.filter(d => d.active);

    const [mobileOpen, setMobileOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") {
            setDarkMode(true);
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }, []);

    // Toggle dark/light mode
    const toggleTheme = () => {
        const next = !darkMode;
        setDarkMode(next);
        if (next) {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <>
            <header className="site-header">
                {/* Left side — mobile: theme toggle + notifications */}
                <div className="header-left-mobile">
                    <button
                        className="theme-toggle theme-toggle-mobile"
                        onClick={toggleTheme}
                        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        title={darkMode ? "Light mode" : "Dark mode"}
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <NotificationCenter />
                </div>

                {/* Logo */}
                <Link href="/" className="header-logo-area">
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt="The Pen Book"
                            className="header-logo-img"
                        />
                    )}
                    <div className="header-logo-inner">
                        <div className="header-logo-text">The Pen</div>
                        <div className="header-logo-sub">
                            <span>B</span>
                            <span>O</span>
                            <span>O</span>
                            <span>K</span>
                        </div>
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
                                {activeDayCategories.map((day) => (
                                    <Link
                                        key={day.name}
                                        href={`/#writings?cat=${encodeURIComponent(day.name)}`}
                                        onClick={() => {
                                            setCatOpen(false);
                                            window.dispatchEvent(
                                                new CustomEvent("selectCategory", { detail: day.name })
                                            );
                                        }}
                                    >
                                        {day.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <NotificationCenter />

                    {/* Dark mode toggle — desktop */}
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        title={darkMode ? "Light mode" : "Dark mode"}
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </nav>

                {/* Right side — mobile: hamburger only */}
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
                {activeDayCategories.map((day) => (
                    <Link
                        key={day.name}
                        href={`/#writings`}
                        className="mobile-cat-link"
                        onClick={() => {
                            setMobileOpen(false);
                            setTimeout(() => {
                                window.dispatchEvent(
                                    new CustomEvent("selectCategory", { detail: day.name })
                                );
                            }, 100);
                        }}
                    >
                        {day.name}
                    </Link>
                ))}
            </div>
        </>
    );
}
