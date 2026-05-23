"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const DAYS_OF_WEEK = [
    { day: 0, label: "Sunday" },
    { day: 1, label: "Monday" },
    { day: 2, label: "Tuesday" },
    { day: 3, label: "Wednesday" },
    { day: 4, label: "Thursday" },
    { day: 5, label: "Friday" },
    { day: 6, label: "Saturday" },
];

export default function SettingsPage() {
    const settings = useQuery(api.writings.getAllSettings);
    const dayCategories = useQuery(api.writings.getAllDayCategories);
    
    const setSetting = useMutation(api.writings.setSetting);
    const updateDayCategory = useMutation(api.writings.updateDayCategory);
    const generateUploadUrl = useMutation(api.writings.generateUploadUrl);

    // Logo state
    const logoStorageId = settings?.logoStorageId;
    const logoUrl = useQuery(
        api.writings.getFileUrl,
        logoStorageId ? { storageId: logoStorageId } : "skip"
    );

    // Signature & Writer details state
    const [signature, setSignature] = useState("");
    const [writerRole, setWriterRole] = useState("");
    const [writerQuote, setWriterQuote] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Social media state
    const [socials, setSocials] = useState({
        twitter: "",
        instagram: "",
        facebook: "",
        linkedin: "",
        github: "",
        website: "",
    });

    // Day categories state
    const [daysState, setDaysState] = useState<Record<number, {
        name: string;
        hexColor: string;
        accentColor: string;
        heroHeadline: string;
        active: boolean;
    }>>({});

    // Expanded day accordion state
    const [expandedDay, setExpandedDay] = useState<number | null>(null);

    useEffect(() => {
        if (settings) {
            setSignature(settings.signature || "");
            setWriterRole(settings.writerRole || "");
            setWriterQuote(settings.writerQuote || "");
            if (settings.socialMedia) {
                try {
                    const parsed = JSON.parse(settings.socialMedia);
                    setSocials({
                        twitter: parsed.twitter || "",
                        instagram: parsed.instagram || "",
                        facebook: parsed.facebook || "",
                        linkedin: parsed.linkedin || "",
                        github: parsed.github || "",
                        website: parsed.website || "",
                    });
                } catch (e) {
                    console.error("Failed to parse social media settings", e);
                }
            }
        }
    }, [settings]);

    useEffect(() => {
        if (dayCategories) {
            const initialDaysState: typeof daysState = {};
            // Initialize for all 7 days
            DAYS_OF_WEEK.forEach(({ day, label }) => {
                const existing = dayCategories.find((dc) => dc.day === day);
                initialDaysState[day] = {
                    name: existing?.name || `Day Theme ${label}`,
                    hexColor: existing?.hexColor || "#b68d40",
                    accentColor: existing?.accentColor || "#1e1e1e",
                    heroHeadline: existing?.heroHeadline || "Stories that stay with you!",
                    active: existing?.active !== undefined ? existing.active : true,
                };
            });
            setDaysState(initialDaysState);
        }
    }, [dayCategories]);

    const handleSocialChange = (key: keyof typeof socials, val: string) => {
        setSocials((prev) => ({ ...prev, [key]: val }));
    };

    const handleDayFieldChange = (day: number, field: string, val: any) => {
        setDaysState((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: val,
            },
        }));
    };

    // Handle file upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        setUploading(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!response.ok) throw new Error("Upload failed");
            const { storageId } = await response.json();
            await setSetting({ key: "logoStorageId", value: storageId });
        } catch (err) {
            console.error("Logo upload failed:", err);
            alert("Upload failed. Please try again.");
        }
        setUploading(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveLogo = async () => {
        await setSetting({ key: "logoStorageId", value: "" });
    };

    // Save All Settings
    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            // 1. Save Signature & Writer details
            await setSetting({ key: "signature", value: signature });
            await setSetting({ key: "writerRole", value: writerRole });
            await setSetting({ key: "writerQuote", value: writerQuote });
            
            // 2. Save Socials
            await setSetting({ key: "socialMedia", value: JSON.stringify(socials) });
            
            // 3. Save Day Categories
            for (const { day } of DAYS_OF_WEEK) {
                const dayData = daysState[day];
                if (dayData) {
                    await updateDayCategory({
                        day,
                        name: dayData.name,
                        hexColor: dayData.hexColor,
                        accentColor: dayData.accentColor,
                        heroHeadline: dayData.heroHeadline,
                        active: dayData.active,
                    });
                }
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Save failed:", err);
            alert("An error occurred while saving your settings.");
        }
        setSaving(false);
    };

    if (settings === undefined || dayCategories === undefined) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="admin-heading">Settings & Theme Panel</h2>

            {/* Logo Upload */}
            <div className="settings-section">
                <label className="settings-label">Logo</label>

                {logoUrl && (
                    <div style={{ marginBottom: 16 }}>
                        <img src={logoUrl} alt="Logo preview" className="logo-preview" />
                        <button
                            onClick={handleRemoveLogo}
                            className="btn btn-sm"
                            style={{ marginTop: 8 }}
                        >
                            Remove Logo
                        </button>
                    </div>
                )}

                <div style={{ position: "relative" }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        style={{
                            width: "100%",
                            border: "1.5px dashed rgba(0,0,0,0.2)",
                            borderRadius: 12,
                            padding: "20px 16px",
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            background: "transparent",
                        }}
                    />
                    {uploading && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(253,246,238,0.9)",
                                borderRadius: 12,
                            }}
                        >
                            <div className="spinner" />
                            <span style={{ marginLeft: 10, fontSize: "0.8rem" }}>
                                Uploading...
                            </span>
                        </div>
                    )}
                </div>
                <p className="settings-help">
                    Upload your logo image. It will appear in the site header and as the favicon.
                </p>
            </div>

            {/* Signature */}
            <div className="settings-section">
                <label className="settings-label">Signature / Watermark</label>
                <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="settings-input"
                />
                <p className="settings-help">
                    This signature will appear at the bottom of every published writing as a watermark.
                </p>
            </div>

            {/* Writer Title/Role */}
            <div className="settings-section">
                <label className="settings-label">Writer Title / Role</label>
                <input
                    type="text"
                    value={writerRole}
                    onChange={(e) => setWriterRole(e.target.value)}
                    placeholder="e.g. Writer and Storyteller"
                    className="settings-input"
                />
                <p className="settings-help">
                    The title or role displayed next to your profile/name on the homepage (e.g., Writer and Storyteller).
                </p>
            </div>

            {/* Writer Description/Quote */}
            <div className="settings-section">
                <label className="settings-label">Writer Description / Quote</label>
                <textarea
                    value={writerQuote}
                    onChange={(e) => setWriterQuote(e.target.value)}
                    placeholder="e.g. A space for words, crafted with care..."
                    className="settings-input"
                    rows={4}
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                />
                <p className="settings-help">
                    A quote or bio displayed next to the latest book on the homepage.
                </p>
            </div>

            {/* Social Media Settings */}
            <div className="settings-section">
                <label className="settings-label">Social Media Accounts</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "12px" }}>
                    {(Object.keys(socials) as Array<keyof typeof socials>).map((key) => (
                        <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600, color: "var(--color-text-muted)" }}>
                                {key}
                            </span>
                            <input
                                type="url"
                                value={socials[key]}
                                onChange={(e) => handleSocialChange(key, e.target.value)}
                                placeholder={`https://instagram.com/yourusername`}
                                className="settings-input"
                                style={{ margin: 0, fontSize: "0.8rem", padding: "10px 14px" }}
                            />
                        </div>
                    ))}
                </div>
                <p className="settings-help">
                    Configure your social links. They will automatically be displayed with nice icons in the footer.
                </p>
            </div>

            {/* Seven Days Categories */}
            <div className="settings-section">
                <label className="settings-label" style={{ marginBottom: "16px", display: "block" }}>
                    Seven Days of the Week Themes & Categories
                </label>

                <div className="days-accordion-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {DAYS_OF_WEEK.map(({ day, label }) => {
                        const dayData = daysState[day] || {
                            name: "",
                            hexColor: "#b68d40",
                            accentColor: "#1e1e1e",
                            heroHeadline: "",
                            active: true,
                        };
                        const isExpanded = expandedDay === day;

                        return (
                            <div
                                key={day}
                                className={`day-card-item ${isExpanded ? "expanded" : ""}`}
                                style={{
                                    border: "1px solid var(--color-border-strong)",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    background: "rgba(0,0,0,0.01)",
                                    transition: "all 0.25s ease",
                                }}
                            >
                                {/* Accordion Header */}
                                <div
                                    onClick={() => setExpandedDay(isExpanded ? null : day)}
                                    style={{
                                        padding: "16px 20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        cursor: "pointer",
                                        background: "var(--color-card-bg)",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        {/* Colored Dot Indicator */}
                                        <div
                                            style={{
                                                width: "18px",
                                                height: "18px",
                                                borderRadius: "50%",
                                                backgroundColor: dayData.hexColor,
                                                border: "1.5px solid var(--color-border-strong)",
                                                boxShadow: `0 0 6px ${dayData.hexColor}44`,
                                            }}
                                        />
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                                                {label} Category: <span style={{ fontStyle: "italic", color: "var(--color-primary)" }}>{dayData.name}</span>
                                            </span>
                                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                                                Active theme for this day
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        {!dayData.active && (
                                            <span className="status-badge" style={{ borderColor: "rgba(220,53,69,0.3)", color: "red" }}>
                                                Inactive
                                            </span>
                                        )}
                                        <span style={{ fontSize: "1.2rem", color: "var(--color-text-muted)", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "" }}>
                                            ▼
                                        </span>
                                    </div>
                                </div>

                                {/* Accordion Content */}
                                {isExpanded && (
                                    <div
                                        style={{
                                            padding: "20px",
                                            background: "var(--color-card-bg-light)",
                                            borderTop: "1px solid var(--color-border)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "16px",
                                        }}
                                    >
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                                            {/* Category Name */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                                                    Theme Category Name
                                                </span>
                                                <input
                                                    type="text"
                                                    value={dayData.name}
                                                    onChange={(e) => handleDayFieldChange(day, "name", e.target.value)}
                                                    placeholder="e.g. Monologue Friday"
                                                    className="settings-input"
                                                    style={{ margin: 0, fontSize: "0.85rem", padding: "10px" }}
                                                />
                                            </div>

                                            {/* Colors Selectors */}
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                                                        Primary Color
                                                    </span>
                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                        <input
                                                            type="color"
                                                            value={dayData.hexColor}
                                                            onChange={(e) => handleDayFieldChange(day, "hexColor", e.target.value)}
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                background: "transparent",
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={dayData.hexColor}
                                                            onChange={(e) => handleDayFieldChange(day, "hexColor", e.target.value)}
                                                            className="settings-input"
                                                            style={{ margin: 0, fontSize: "0.8rem", padding: "8px 10px", flex: 1 }}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                                                        Accent Color
                                                    </span>
                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                        <input
                                                            type="color"
                                                            value={dayData.accentColor}
                                                            onChange={(e) => handleDayFieldChange(day, "accentColor", e.target.value)}
                                                            style={{
                                                                width: "36px",
                                                                height: "36px",
                                                                border: "none",
                                                                borderRadius: "6px",
                                                                cursor: "pointer",
                                                                background: "transparent",
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={dayData.accentColor}
                                                            onChange={(e) => handleDayFieldChange(day, "accentColor", e.target.value)}
                                                            className="settings-input"
                                                            style={{ margin: 0, fontSize: "0.8rem", padding: "8px 10px", flex: 1 }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Headline/Tagline */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                                                Homepage Headline / Tagline for this day
                                            </span>
                                            <input
                                                type="text"
                                                value={dayData.heroHeadline}
                                                onChange={(e) => handleDayFieldChange(day, "heroHeadline", e.target.value)}
                                                placeholder="e.g. Reflections that flow with the wind."
                                                className="settings-input"
                                                style={{ margin: 0, fontSize: "0.85rem", padding: "10px" }}
                                            />
                                        </div>

                                        {/* Active Status */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                                            <input
                                                type="checkbox"
                                                id={`active-${day}`}
                                                checked={dayData.active}
                                                onChange={(e) => handleDayFieldChange(day, "active", e.target.checked)}
                                                style={{ cursor: "pointer", width: "16px", height: "16px" }}
                                            />
                                            <label htmlFor={`active-${day}`} style={{ fontSize: "0.8rem", userSelect: "none", cursor: "pointer", fontWeight: 500 }}>
                                                Enable theme and active listing for this day
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="settings-help">
                    Customize the 7 days of the week categories. The website primary colors, accents, and hero tagline will automatically update based on which day it is today!
                </p>
            </div>

            {/* Save button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "24px" }}>
                <button onClick={handleSave} disabled={saving} className="btn">
                    {saving ? "Saving..." : "Save Settings"}
                </button>
                {saved && <span className="save-indicator">✓ Saved Successfully</span>}
            </div>
        </div>
    );
}
