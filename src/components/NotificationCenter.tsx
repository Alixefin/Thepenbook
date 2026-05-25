"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bell } from "lucide-react";

interface RecentChapter {
    _id: string;
    title: string;
    chapterNumber: number;
    updatedAt: number;
    writingId: string;
    writingTitle: string;
    writingSlug: string;
}

export default function NotificationCenter() {
    const recentChapters = useQuery(api.writings.getRecentChapters);
    const [mounted, setMounted] = useState(false);
    const [seenChapters, setSeenChapters] = useState<string[]>([]);
    const [panelOpen, setPanelOpen] = useState(false);
    const [activeToast, setActiveToast] = useState<RecentChapter | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Load initial client data on mount
    useEffect(() => {
        setMounted(true);

        const storedSeen = localStorage.getItem("seenChapters");
        const parsedSeen: string[] = storedSeen ? JSON.parse(storedSeen) : [];
        setSeenChapters(parsedSeen);

        const lastVisitedStr = localStorage.getItem("lastVisited");
        const lastVisited = lastVisitedStr ? parseInt(lastVisitedStr, 10) : 0;

        const lastPopupTimeStr = localStorage.getItem("lastNotificationPopupTime");
        const lastPopupTime = lastPopupTimeStr ? parseInt(lastPopupTimeStr, 10) : 0;

        // Check for new chapters since last visit
        if (recentChapters && recentChapters.length > 0) {
            // Find chapters newer than last visited, and not seen yet
            const unreadNewChapters = recentChapters.filter(
                (ch) => ch.updatedAt > lastVisited && !parsedSeen.includes(ch._id)
            );

            if (unreadNewChapters.length > 0) {
                // Check if we already showed a popup today (within last 12 hours)
                const isNewDay = Date.now() - lastPopupTime > 12 * 60 * 60 * 1000;
                if (isNewDay) {
                    // Show the latest unread chapter as a toast popup
                    setActiveToast(unreadNewChapters[0]);
                    localStorage.setItem("lastNotificationPopupTime", Date.now().toString());
                }
            }
        }

        // Update lastVisited to now for the next session
        localStorage.setItem("lastVisited", Date.now().toString());
    }, [recentChapters]);

    // Handle clicking outside the notification panel to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setPanelOpen(false);
            }
        }
        if (panelOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [panelOpen]);

    if (!mounted || !recentChapters) return null;

    // Filter to find unread chapter IDs
    const unreadChapters = recentChapters.filter((ch) => !seenChapters.includes(ch._id));
    const unreadCount = unreadChapters.length;

    const markAsRead = (id: string) => {
        const nextSeen = [...seenChapters];
        if (!nextSeen.includes(id)) {
            nextSeen.push(id);
            setSeenChapters(nextSeen);
            localStorage.setItem("seenChapters", JSON.stringify(nextSeen));
        }
    };

    const markAllAsRead = () => {
        const allIds = recentChapters.map((ch) => ch._id);
        const nextSeen = Array.from(new Set([...seenChapters, ...allIds]));
        setSeenChapters(nextSeen);
        localStorage.setItem("seenChapters", JSON.stringify(nextSeen));
    };

    return (
        <div className="notification-center-container" ref={panelRef}>
            {/* Bell trigger */}
            <button
                className={`notification-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setPanelOpen(!panelOpen)}
                aria-label="Notifications"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {/* Notifications Dropdown Panel */}
            {panelOpen && (
                <div className="notification-panel">
                    <div className="notification-panel-header">
                        <h4>Recent Chapters</h4>
                        {unreadCount > 0 && (
                            <button className="mark-all-read-btn" onClick={markAllAsRead}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {recentChapters.length === 0 ? (
                            <div className="notification-empty">No updates recently.</div>
                        ) : (
                            recentChapters.map((ch) => {
                                const isUnread = !seenChapters.includes(ch._id);
                                return (
                                    <Link
                                        key={ch._id}
                                        href={`/${ch.writingSlug}?ch=${ch.chapterNumber}`}
                                        className={`notification-item ${isUnread ? "unread" : ""}`}
                                        onClick={() => {
                                            markAsRead(ch._id);
                                            setPanelOpen(false);
                                        }}
                                    >
                                        <div className="notification-item-dot" />
                                        <div className="notification-item-content">
                                            <span className="notification-writing-title">
                                                {ch.writingTitle}
                                            </span>
                                            <span className="notification-chapter-info">
                                                Chapter {ch.chapterNumber}: {ch.title}
                                            </span>
                                            <span className="notification-time">
                                                {new Date(ch.updatedAt).toLocaleDateString(undefined, {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Toast Notification Popup */}
            {activeToast && (
                <div className="notification-toast">
                    <div className="notification-toast-content">
                        <div className="notification-toast-header">
                            <span className="toast-tag">New Chapter Added!</span>
                            <button
                                className="toast-close-btn"
                                onClick={() => setActiveToast(null)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <h4 className="toast-title">{activeToast.writingTitle}</h4>
                        <p className="toast-desc">
                            Chapter {activeToast.chapterNumber}: {activeToast.title} is now available to read.
                        </p>
                        <Link
                            href={`/${activeToast.writingSlug}?ch=${activeToast.chapterNumber}`}
                            className="toast-action-btn"
                            onClick={() => {
                                markAsRead(activeToast._id);
                                setActiveToast(null);
                            }}
                        >
                            Read Now →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
