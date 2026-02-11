"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export default function SettingsPage() {
    const settings = useQuery(api.writings.getAllSettings);
    const setSetting = useMutation(api.writings.setSetting);
    const generateUploadUrl = useMutation(api.writings.generateUploadUrl);

    // Get the logo URL from storage if we have a storage ID
    const logoStorageId = settings?.logoStorageId;
    const logoUrl = useQuery(
        api.writings.getFileUrl,
        logoStorageId ? { storageId: logoStorageId } : "skip"
    );

    const [signature, setSignature] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (settings) {
            setSignature(settings.signature || "");
        }
    }, [settings]);

    // Handle file upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }

        setUploading(true);
        try {
            // Step 1: Get a signed upload URL from Convex
            const uploadUrl = await generateUploadUrl();

            // Step 2: Upload the file to Convex storage
            const response = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!response.ok) throw new Error("Upload failed");

            const { storageId } = await response.json();

            // Step 3: Save the storage ID in settings
            await setSetting({ key: "logoStorageId", value: storageId });
        } catch (err) {
            console.error("Logo upload failed:", err);
            alert("Upload failed. Please try again.");
        }
        setUploading(false);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Remove logo
    const handleRemoveLogo = async () => {
        await setSetting({ key: "logoStorageId", value: "" });
    };

    // Save signature
    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await setSetting({ key: "signature", value: signature });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error("Save failed:", err);
        }
        setSaving(false);
    };

    if (settings === undefined) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="admin-heading">Settings</h2>

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
                    Upload your logo image. It will appear in the site header and as the
                    favicon. Recommended: square, min 128×128px, PNG or SVG.
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
                    This signature will appear at the bottom of every published writing as
                    a watermark. Leave empty to hide.
                </p>
            </div>

            {/* Save button */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={handleSave} disabled={saving} className="btn">
                    {saving ? "Saving..." : "Save Settings"}
                </button>
                {saved && <span className="save-indicator">✓ Saved</span>}
            </div>
        </div>
    );
}
