"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";

interface ShareCardProps {
    title: string;
    snippet: string;
    author: string;
    colorTag?: string;
    slug: string;
    onClose: () => void;
}

/**
 * Generates a Spotify-style share card with:
 * - A snippet of the writing text
 * - The title
 * - A QR code linking to the writing
 * - A shareable link
 */
export default function ShareCard({
    title,
    snippet,
    author,
    colorTag,
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

    // Truncate snippet to ~180 chars for a clean card
    const truncatedSnippet =
        snippet.length > 180 ? snippet.slice(0, 177) + "..." : snippet;

    const generateCard = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const W = 720;
        const H = 960;
        const dpr = 2;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";

        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);

        // ─── Background gradient ───
        const accent = colorTag || "#b68d40";
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#1a1a1a");
        grad.addColorStop(0.5, "#222");
        grad.addColorStop(1, "#1a1a1a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Accent stripe
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, 6, H);

        // ─── Decorative dots ───
        ctx.globalAlpha = 0.06;
        for (let y = 0; y < H; y += 24) {
            for (let x = 0; x < W; x += 24) {
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // ─── Snippet area ───
        const snippetY = 80;
        const snippetX = 56;
        const snippetW = W - 112;

        // Quote mark
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.35;
        ctx.font = 'italic 120px Georgia, "Times New Roman", serif';
        ctx.fillText("\u201C", snippetX - 12, snippetY + 80);
        ctx.globalAlpha = 1;

        // Snippet text
        ctx.fillStyle = "#e8e0d4";
        ctx.font = 'italic 26px Georgia, "Times New Roman", serif';
        const lines = wrapText(ctx, truncatedSnippet, snippetW);
        let ly = snippetY + 130;
        for (const line of lines) {
            ctx.fillText(line, snippetX, ly);
            ly += 40;
        }

        // ─── Divider ───
        const divY = Math.max(ly + 40, 480);
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(snippetX, divY);
        ctx.lineTo(W - snippetX, divY);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // ─── Title ───
        ctx.fillStyle = "#fff";
        ctx.font = 'bold 34px "Helvetica Neue", Helvetica, Arial, sans-serif';
        const titleLines = wrapText(ctx, title, snippetW);
        let ty = divY + 50;
        for (const tl of titleLines) {
            ctx.fillText(tl, snippetX, ty);
            ty += 46;
        }

        // ─── Author ───
        ctx.fillStyle = accent;
        ctx.font =
            '16px "Helvetica Neue", Helvetica, Arial, sans-serif';
        ctx.fillText(author, snippetX, ty + 8);

        // ─── QR Code ───
        const qrSize = 140;
        const qrX = W - snippetX - qrSize;
        const qrY = H - 60 - qrSize;

        try {
            const qrDataUrl = await QRCode.toDataURL(shareUrl, {
                width: qrSize * 2,
                margin: 1,
                color: { dark: "#ffffffdd", light: "#00000000" },
                errorCorrectionLevel: "M",
            });
            const qrImg = new Image();
            qrImg.onload = () => {
                // QR background
                ctx.fillStyle = "rgba(255,255,255,0.08)";
                roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 16);
                ctx.fill();
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                // "Scan to read" label
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.font =
                    '11px "Helvetica Neue", Helvetica, Arial, sans-serif';
                ctx.textAlign = "center";
                ctx.fillText("SCAN TO READ", qrX + qrSize / 2, qrY + qrSize + 22);
                ctx.textAlign = "start";

                // The Pen Book branding
                ctx.fillStyle = "rgba(255,255,255,0.25)";
                ctx.font =
                    '600 12px "Helvetica Neue", Helvetica, Arial, sans-serif';
                ctx.fillText("THE PEN BOOK", snippetX, H - 36);

                // Export
                setImageUrl(canvas.toDataURL("image/png"));
            };
            qrImg.src = qrDataUrl;
        } catch {
            setImageUrl(canvas.toDataURL("image/png"));
        }
    }, [title, truncatedSnippet, author, colorTag, shareUrl]);

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
            // Fallback
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
                // User cancelled or not supported — fall through to link copy
                handleCopyLink();
            }
        } else {
            handleCopyLink();
        }
    };

    return (
        <div className="share-overlay" onClick={onClose}>
            <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="share-close">
                    ×
                </button>
                <h3 className="share-heading">Share this writing</h3>

                {/* Canvas (hidden, used for generation) */}
                <canvas
                    ref={canvasRef}
                    style={{ display: "none" }}
                />

                {/* Preview */}
                {imageUrl && (
                    <div className="share-preview">
                        <img src={imageUrl} alt="Share card" className="share-card-img" />
                    </div>
                )}

                {/* Link */}
                <div className="share-link-row">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="share-link-input"
                    />
                    <button onClick={handleCopyLink} className="btn btn-sm">
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>

                {/* Actions */}
                <div className="share-actions">
                    <button onClick={handleDownload} className="btn">
                        📥 Download Image
                    </button>
                    <button onClick={handleShare} className="btn">
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Helpers ───

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
): string[] {
    const words = text.split(" ");
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

    // Limit to 8 lines
    if (lines.length > 8) {
        return [...lines.slice(0, 7), lines[7] + "..."];
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
