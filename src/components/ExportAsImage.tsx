"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const QRCode = dynamic(() => import("qrcode.react"), { ssr: false });

interface ExportAsImageProps {
  title: string;
  content: string;
  slug: string;
  signature?: string;
  dayThemeColor?: string;
  dayThemeName?: string;
}

/**
 * ExportAsImage - Generates and downloads A4 image of writing
 * with day theme color as accent bar and QR code linking to full post
 */
export default function ExportAsImage({
  title,
  content,
  slug,
  signature,
  dayThemeColor = "#c9a96e",
  dayThemeName = "The Pen Book",
}: ExportAsImageProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Strip HTML tags from content for preview
  function stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 200) + "...";
  }

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `/${slug}`;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById("export-container");
      if (!element) return;

      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#fdf6ee",
        allowTaint: true,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-container-outer">
      {/* Hidden export element */}
      <div id="export-container" className="export-a4-page" style={{ display: "none" }}>
        <div className="export-page-inner">
          {/* Left theme accent bar */}
          <div
            className="export-theme-bar"
            style={{ backgroundColor: dayThemeColor }}
            aria-hidden="true"
          />

          {/* Content area */}
          <div className="export-content">
            {/* Theme badge */}
            <div className="export-theme-badge" style={{ color: dayThemeColor }}>
              {dayThemeName}
            </div>

            {/* Title */}
            <h1 className="export-title">{title}</h1>

            {/* Content preview */}
            <p className="export-preview">{stripHtml(content)}</p>

            {/* Divider */}
            <div className="export-divider" style={{ borderColor: dayThemeColor }} />

            {/* QR Code and info section */}
            <div className="export-footer-section">
              <div className="export-qr-section">
                <div className="export-qr-label">Read Full Story</div>
                <div className="export-qr-code">
                  <QRCode
                    value={fullUrl}
                    size={100}
                    level="H"
                    includeMargin={false}
                    fgColor="#1a1a1a"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Author and date info */}
              <div className="export-info-section">
                <div className="export-author">{signature || "The Pen Book"}</div>
                <div className="export-date">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export button and preview */}
      <div className="export-modal-content">
        <h3 className="export-heading">Export as A4 Image</h3>

        {/* Preview */}
        <div className="export-preview-container">
          <div
            className="export-preview-page"
            style={{ borderLeftColor: dayThemeColor }}
          >
            <div className="export-preview-title">{title}</div>
            <p className="export-preview-text">{stripHtml(content)}</p>
            <div className="export-preview-footer">
              <span className="export-preview-badge" style={{ color: dayThemeColor }}>
                {dayThemeName}
              </span>
              <span className="export-preview-qr">📱 QR</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="export-actions">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn export-btn"
          >
            {isExporting ? "Exporting..." : "Download Image"}
          </button>
          <p className="export-help-text">
            Downloads as PNG at A4 size (2100×2970px at 72dpi)
          </p>
        </div>
      </div>
    </div>
  );
}
