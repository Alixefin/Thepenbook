"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";

interface ShareCardProps {
    title: string;
    snippet: string;
    author: string;
    colorTag?: string;
    dayCategoryName?: string;
    dayCategoryColor?: string;
    dayCategoryAccent?: string;
    slug: string;
    onClose: () => void;
}

/**
 * Generates an elegant, classical A4-proportioned share card (portrait 1:1.414 ratio) with:
 * - A vertical sidebar themed around the day the writing was posted
 * - Beautiful double gold/accent borders
 * - Wrapped elegant serif text with paragraph spacing
 * - Scan-to-read QR Code and author watermark signature
 */
export default function ShareCard({
    title,
    snippet,
    author,
    colorTag,
    dayCategoryName,
    dayCategoryColor,
    dayCategoryAccent,
    slug,
    onClose,
}: ShareCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const shareUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/${slug}`
            : `/${slug}`;

    const generateCard = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // A4 Dimensions: 800px x 1130px (1:1.4125 ratio)
        const W = 800;
        const H = 1130;
        const dpr = 2.5; // High resolution display backing
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";

        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);

        // Theme colors
        const themeColor = dayCategoryColor || colorTag || "#b68d40";
        const themeAccent = dayCategoryAccent || "#C9956D";

        // ─── 1. Left Sidebar (Day Theme Tag) ───
        const sidebarW = 75;
        ctx.fillStyle = themeColor;
        ctx.fillRect(0, 0, sidebarW, H);

        // Sidebar linen micro-texture
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        for (let y = 0; y < H; y += 4) {
            ctx.fillRect(0, y, sidebarW, 2);
        }
        for (let x = 0; x < sidebarW; x += 4) {
            ctx.fillRect(x, 0, 2, H);
        }

        // Draw vertical sidebar text
        ctx.save();
        ctx.translate(sidebarW / 2 + 5, H / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillStyle = getContrastColor(themeColor);
        
        // Dynamic Label based on day category name
        const displayCategory = (dayCategoryName || "The Pen Book Collection").toUpperCase();
        ctx.font = 'bold 15px "Montserrat", "Helvetica Neue", Arial, sans-serif';
        ctx.letterSpacing = "6px";
        ctx.fillText(displayCategory, 0, 0);
        ctx.restore();

        // ─── 2. Main Canvas Body (Cream Paper) ───
        const mainW = W - sidebarW;
        ctx.fillStyle = "#FAF8F4"; // Fine cream paper
        ctx.fillRect(sidebarW, 0, mainW, H);

        // Paper fine linen texture
        ctx.fillStyle = "rgba(0, 0, 0, 0.015)";
        for (let y = 0; y < H; y += 3) {
            ctx.fillRect(sidebarW, y, mainW, 1.5);
        }
        for (let x = sidebarW; x < W; x += 3) {
            ctx.fillRect(x, 0, 1.5, H);
        }

        // Add page shading/depth to give hardcover feel near spine
        const spineShadow = ctx.createLinearGradient(sidebarW, 0, sidebarW + 25, 0);
        spineShadow.addColorStop(0, "rgba(0, 0, 0, 0.22)");
        spineShadow.addColorStop(0.2, "rgba(0, 0, 0, 0.08)");
        spineShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = spineShadow;
        ctx.fillRect(sidebarW, 0, 25, H);

        // ─── 3. Double Vintage Borders ───
        const borderOuterX = sidebarW + 32;
        const borderOuterY = 32;
        const borderOuterW = W - borderOuterX - 32;
        const borderOuterH = H - 64;

        // Outer border
        ctx.strokeStyle = themeAccent;
        ctx.lineWidth = 1;
        ctx.strokeRect(borderOuterX, borderOuterY, borderOuterW, borderOuterH);

        // Inner border (double frame effect)
        const gap = 5;
        ctx.strokeStyle = themeAccent;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
            borderOuterX + gap,
            borderOuterY + gap,
            borderOuterW - gap * 2,
            borderOuterH - gap * 2
        );

        // Vintage corner ornaments (drawn as accent dots/emblems)
        const frameX = borderOuterX + gap;
        const frameY = borderOuterY + gap;
        const frameW = borderOuterW - gap * 2;
        const frameH = borderOuterH - gap * 2;

        ctx.fillStyle = themeAccent;
        const corners = [
            [frameX, frameY],
            [frameX + frameW, frameY],
            [frameX, frameY + frameH],
            [frameX + frameW, frameY + frameH]
        ];
        for (const [cx, cy] of corners) {
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // ─── 4. Header Ornament & Book Title ───
        const centerX = sidebarW + mainW / 2;
        
        // Vintage glyph divider
        ctx.fillStyle = themeAccent;
        ctx.font = '22px Georgia, serif';
        ctx.textAlign = "center";
        ctx.fillText("❦", centerX, frameY + 45);

        // Title styling
        ctx.fillStyle = "#1e1b15"; // Soft warm charcoal
        ctx.font = 'bold italic 34px Georgia, "Times New Roman", serif';
        const titleLines = wrapText(ctx, title, frameW - 80, 3);
        let ty = frameY + 95;
        for (const tl of titleLines) {
            ctx.fillText(tl, centerX, ty);
            ty += 46;
        }

        // Middle Divider
        ctx.strokeStyle = "rgba(182, 141, 64, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 80, ty + 12);
        ctx.lineTo(centerX + 80, ty + 12);
        ctx.stroke();

        // ─── 5. Large Quotation Mark & Wrapped Writing Text ───
        const textX = frameX + 45;
        const textY = ty + 70;
        const textW = frameW - 90;

        // Giant quote mark watermark
        ctx.fillStyle = themeAccent;
        ctx.globalAlpha = 0.08;
        ctx.font = 'italic 200px Georgia, serif';
        ctx.fillText("\u201C", textX + 30, textY + 110);
        ctx.globalAlpha = 1;

        // Render the story content beautifully
        ctx.fillStyle = "#2c2820"; // Elegant legible paper ink color
        ctx.font = '19px Georgia, "Times New Roman", serif';
        ctx.textAlign = "left";
        
        // Fit around 20 lines of wrapped paragraph text comfortably
        const bodyLines = wrapText(ctx, snippet, textW, 20, true);
        let ly = textY;
        const lineSpacing = 32;

        for (const line of bodyLines) {
            if (line === "") {
                // Paragraph break
                ly += 16;
            } else {
                ctx.fillText(line, textX, ly);
                ly += lineSpacing;
            }
        }

        // ─── 6. Footer Signature, Date & QR Code Branding ───
        const footerY = frameY + frameH - 50;

        // Author/Signature Watermark
        ctx.fillStyle = "#1e1b15";
        ctx.font = 'italic italic 19px Georgia, serif';
        ctx.textAlign = "left";
        ctx.fillText(`— Written by ${author}`, textX, footerY - 45);

        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.font = '12px "Montserrat", Arial, sans-serif';
        ctx.letterSpacing = "1.5px";
        ctx.fillText("PUBLISHED ON THE PEN BOOK", textX, footerY - 15);

        // QR Code generation
        const qrSize = 105;
        const qrX = frameX + frameW - qrSize - 35;
        const qrY = frameY + frameH - qrSize - 35;

        try {
            const qrDataUrl = await QRCode.toDataURL(shareUrl, {
                width: qrSize * 2,
                margin: 1,
                color: { dark: "#1e1b15ee", light: "#00000000" },
                errorCorrectionLevel: "M",
            });
            const qrImg = new Image();
            qrImg.onload = () => {
                // Draw QR Code background
                ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
                roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 8);
                ctx.fill();
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                // QR Caption
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.font = '600 9px "Montserrat", Arial, sans-serif';
                ctx.textAlign = "center";
                ctx.letterSpacing = "1px";
                ctx.fillText("SCAN TO READ FULL STORY", qrX + qrSize / 2, qrY + qrSize + 16);

                // Export final URL
                setImageUrl(canvas.toDataURL("image/png"));
            };
            qrImg.src = qrDataUrl;
        } catch {
            setImageUrl(canvas.toDataURL("image/png"));
        }
    }, [title, snippet, author, colorTag, dayCategoryName, dayCategoryColor, dayCategoryAccent, shareUrl]);

    useEffect(() => {
        generateCard();
    }, [generateCard]);

    const handleDownload = () => {
        if (!imageUrl) return;
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = `${slug}-share.png`;
        a.click();
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.createElement("input");
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (navigator.share && imageUrl) {
            try {
                const res = await fetch(imageUrl);
                const blob = await res.blob();
                const file = new File([blob], `${slug}-share.png`, {
                    type: "image/png",
                });
                await navigator.share({
                    title,
                    text: `Read "${title}" on The Pen Book`,
                    url: shareUrl,
                    files: [file],
                });
            } catch {
                handleCopyLink();
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <div className="share-overlay" onClick={onClose}>
            <div className="share-modal share-modal-a4" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="share-close">
                    ×
                </button>
                <h3 className="share-heading">Share this writing</h3>

                {/* Canvas (hidden) */}
                <canvas
                    ref={canvasRef}
                    style={{ display: "none" }}
                />

                {/* A4 Preview Frame */}
                {imageUrl ? (
                    <div className="share-preview share-preview-a4">
                        <img src={imageUrl} alt="Share card A4" className="share-card-img-a4" />
                    </div>
                ) : (
                    <div className="loading-center">
                        <div className="spinner" />
                    </div>
                )}

                {/* Share bar */}
                <div className="share-link-row">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="share-link-input"
                    />
                    <button onClick={handleCopyLink} className="btn btn-sm">
                        {copied ? "Copied!" : "Copy Link"}
                    </button>
                </div>

                {/* Actions */}
                <div className="share-actions">
                    <button onClick={handleDownload} className="btn btn-primary-theme">
                        📥 Save Image (A4)
                    </button>
                    <button onClick={handleShare} className="btn">
                        📤 Share Post
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ───

function getContrastColor(hexColor: string): string {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number = 20,
    supportParagraphs: boolean = false
): string[] {
    if (!text) return [];

    // Strip HTML tags for canvas rendering
    const cleanText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    if (!supportParagraphs) {
        const words = cleanText.split(" ");
        const lines: string[] = [];
        let current = "";

        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        if (lines.length > maxLines) {
            return [...lines.slice(0, maxLines - 1), lines[maxLines - 1] + "..."];
        }
        return lines;
    }

    // Support paragraph splits & continuation warnings
    const sentences = cleanText.split(". ");
    const lines: string[] = [];
    let currentLine = "";

    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i] + (i < sentences.length - 1 ? "." : "");
        const words = sentence.split(" ");

        for (const word of words) {
            if (lines.length >= maxLines) break;
            const test = currentLine ? `${currentLine} ${word}` : word;
            
            if (ctx.measureText(test).width > maxWidth) {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            } else {
                currentLine = test;
            }
        }

        // Add a line break for paragraph feeling on long texts
        if (lines.length < maxLines && currentLine) {
            lines.push(currentLine);
            currentLine = "";
            
            // Add a paragraph gap every 3rd sentence
            if (i > 0 && i % 3 === 0 && lines.length < maxLines - 2) {
                lines.push("");
            }
        }
    }

    if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
    }

    // Append elegant ellipsis if the story is too long for the sharing frame
    if (lines.length >= maxLines) {
        lines[lines.length - 1] = lines[lines.length - 1].slice(0, -10) + "... (continued on reading page)";
    }

    return lines;
}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

