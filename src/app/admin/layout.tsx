"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (sessionStorage.getItem("penbook_admin") === "true") {
            setAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin";
        if (password === correct) {
            setAuthenticated(true);
            sessionStorage.setItem("penbook_admin", "true");
            setError(false);
        } else {
            setError(true);
        }
    };

    if (!authenticated) {
        return (
            <div className="auth-gate">
                <form onSubmit={handleLogin} className="auth-form">
                    <h2 className="auth-title">Writer&apos;s Desk</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="auth-input"
                        autoFocus
                    />
                    {error && <p className="auth-error">Wrong password. Try again.</p>}
                    <button type="submit" className="btn" style={{ width: "100%" }}>
                        Enter
                    </button>
                </form>
            </div>
        );
    }

    const isActive = (path: string) => pathname === path;

    return (
        <div className="page-content">
            <nav className="admin-nav">
                <Link
                    href="/admin"
                    className={`admin-nav-link ${isActive("/admin") ? "is-active" : ""}`}
                >
                    Dashboard
                </Link>
                <Link
                    href="/admin/write"
                    className={`admin-nav-link ${isActive("/admin/write") ? "is-active" : ""}`}
                >
                    + New
                </Link>
                <Link
                    href="/admin/settings"
                    className={`admin-nav-link ${isActive("/admin/settings") ? "is-active" : ""}`}
                >
                    Settings
                </Link>
                <div className="admin-nav-spacer" />
                <button
                    onClick={() => {
                        sessionStorage.removeItem("penbook_admin");
                        setAuthenticated(false);
                    }}
                    className="admin-nav-logout"
                >
                    Logout
                </button>
            </nav>
            {children}
        </div>
    );
}
