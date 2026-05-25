"use client";

/**
 * DynamicCoverArt — generates a rich, unique SVG cover art image
 * based on the title, category, and color tag of a writing.
 *
 * Used by BookCover.tsx as a fallback when no uploaded cover image exists.
 */

interface DynamicCoverArtProps {
    title: string;
    category?: string;
    colorTag?: string;
    size?: "large" | "small";
}

/** Deterministic pseudo-random number seeded by a string */
function seededRandom(seed: string, index: number): number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    h = Math.imul(h ^ index, 2654435761) >>> 0;
    return (h & 0xFFFFFF) / 0xFFFFFF;
}

/** Pick a pattern style deterministically from the title */
type PatternType = "geometric" | "waves" | "dots" | "crosshatch" | "diagonal";

function getPatternType(title: string): PatternType {
    const patterns: PatternType[] = ["geometric", "waves", "dots", "crosshatch", "diagonal"];
    return patterns[title.length % patterns.length];
}

/** Parse hex color to rgb array */
function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
}

/** Darken or lighten a hex color by a factor (positive = lighter, negative = darker) */
function adjustColor(hex: string, factor: number): string {
    const [r, g, b] = hexToRgb(hex);
    const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v)));
    return `rgb(${clamp(r + factor)}, ${clamp(g + factor)}, ${clamp(b + factor)})`;
}

/** Derive light text vs dark text from background */
function getContrastText(hex: string): string {
    const [r, g, b] = hexToRgb(hex);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.95)";
}

/** Split a long title into up to 3 lines */
function wrapTitle(title: string, maxChars: number): string[] {
    const words = title.split(" ");
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
        if ((current + " " + word).trim().length > maxChars) {
            if (current) lines.push(current.trim());
            current = word;
        } else {
            current = (current + " " + word).trim();
        }
        if (lines.length >= 2) {
            // Stop after 2 lines, add remainder to 3rd
            if (current) {
                lines.push(current.trim());
                current = "";
            }
            break;
        }
    }
    if (current && lines.length < 3) lines.push(current.trim());
    return lines.slice(0, 3);
}

export default function DynamicCoverArt({
    title,
    category,
    colorTag,
    size = "large",
}: DynamicCoverArtProps) {
    const baseColor = colorTag || "#D4A853";
    const darkColor = adjustColor(baseColor, -55);
    const lightColor = adjustColor(baseColor, 30);
    const accentColor = adjustColor(baseColor, -30);
    const textColor = getContrastText(baseColor);
    const subtleColor = getContrastText(baseColor) === "rgba(255,255,255,0.95)"
        ? "rgba(255,255,255,0.15)"
        : "rgba(0,0,0,0.08)";

    const seed = title + (category || "");
    const pattern = getPatternType(title);

    const isLarge = size === "large";
    const w = isLarge ? 200 : 130;
    const h = isLarge ? 280 : 185;

    // Title layout
    const maxChars = isLarge ? 14 : 10;
    const titleLines = wrapTitle(title, maxChars);
    const titleFontSize = isLarge
        ? (titleLines[0]?.length > 10 ? 14 : 17)
        : (titleLines[0]?.length > 10 ? 9 : 11);
    const titleY = isLarge ? h * 0.58 : h * 0.58;
    const lineHeight = titleFontSize * 1.35;

    // Category label
    const catFontSize = isLarge ? 8 : 5.5;

    // Monogram letter
    const mono = title.trim().charAt(0).toUpperCase();
    const monoSize = isLarge ? 52 : 34;
    const monoY = isLarge ? h * 0.36 : h * 0.36;

    // Generate decorative shapes based on pattern type
    const shapes = () => {
        const els: React.ReactNode[] = [];

        if (pattern === "geometric") {
            for (let i = 0; i < 5; i++) {
                const x = seededRandom(seed, i * 3) * w;
                const y = seededRandom(seed, i * 3 + 1) * (h * 0.55);
                const r = seededRandom(seed, i * 3 + 2) * (isLarge ? 55 : 36) + (isLarge ? 10 : 7);
                const opacity = 0.06 + seededRandom(seed, i + 20) * 0.1;
                els.push(
                    <circle key={`geo-${i}`} cx={x} cy={y} r={r}
                        fill={textColor === "rgba(255,255,255,0.95)" ? "white" : "black"}
                        opacity={opacity} />
                );
            }
            for (let i = 0; i < 4; i++) {
                const x = seededRandom(seed, i * 4 + 100) * w;
                const y = seededRandom(seed, i * 4 + 101) * (h * 0.55);
                const side = seededRandom(seed, i * 4 + 102) * (isLarge ? 40 : 26) + (isLarge ? 8 : 5);
                const rot = seededRandom(seed, i * 4 + 103) * 90;
                const opacity = 0.06 + seededRandom(seed, i + 50) * 0.08;
                els.push(
                    <rect key={`rect-${i}`}
                        x={x - side / 2} y={y - side / 2}
                        width={side} height={side}
                        fill={textColor === "rgba(255,255,255,0.95)" ? "white" : "black"}
                        opacity={opacity}
                        transform={`rotate(${rot}, ${x}, ${y})`}
                    />
                );
            }
        }

        if (pattern === "waves") {
            for (let i = 0; i < 6; i++) {
                const yPos = (h * 0.55 / 6) * i + seededRandom(seed, i * 2) * 10;
                const amp = seededRandom(seed, i * 2 + 1) * (isLarge ? 12 : 8) + (isLarge ? 4 : 3);
                const freq = (seededRandom(seed, i * 2 + 2) * 0.04 + 0.02);
                const points: string[] = [];
                for (let x2 = 0; x2 <= w; x2 += 4) {
                    const y2 = yPos + Math.sin(x2 * freq) * amp;
                    points.push(`${x2},${y2}`);
                }
                els.push(
                    <polyline key={`wave-${i}`}
                        points={points.join(" ")}
                        fill="none"
                        stroke={textColor === "rgba(255,255,255,0.95)" ? "white" : "black"}
                        strokeWidth={0.8}
                        opacity={0.08 + seededRandom(seed, i + 30) * 0.1}
                    />
                );
            }
        }

        if (pattern === "dots") {
            const cols = isLarge ? 10 : 7;
            const rows = isLarge ? 7 : 5;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = (w / cols) * (col + 0.5);
                    const y = (h * 0.52 / rows) * (row + 0.5);
                    const r = seededRandom(seed, row * 100 + col) * (isLarge ? 3.5 : 2.5) + (isLarge ? 1 : 0.8);
                    const opacity = 0.05 + seededRandom(seed, row * 100 + col + 50) * 0.12;
                    els.push(
                        <circle key={`dot-${row}-${col}`}
                            cx={x} cy={y} r={r}
                            fill={textColor === "rgba(255,255,255,0.95)" ? "white" : "black"}
                            opacity={opacity}
                        />
                    );
                }
            }
        }

        if (pattern === "crosshatch") {
            const spacing = isLarge ? 18 : 12;
            for (let i = -h; i < w + h; i += spacing) {
                els.push(
                    <line key={`ch1-${i}`} x1={i} y1={0} x2={i + h * 0.55} y2={h * 0.55}
                        stroke={textColor === "rgba(255,255,255,0.95)" ? "white" : "black"}
                        strokeWidth={0.6} opacity={0.07} />
                );
                els.push(
                    <line key={`ch2-${i}`} x1={i} y1={h * 0.55} x2={i + h * 0.55} y2={0}
                        stroke={textColor === "rgba(255,255,255,0.95)" ? "white" : "black"}
                        strokeWidth={0.6} opacity={0.07} />
                );
            }
        }

        if (pattern === "diagonal") {
            const spacing = isLarge ? 22 : 15;
            for (let i = -h; i < w + h; i += spacing) {
                els.push(
                    <line key={`diag-${i}`} x1={i} y1={0} x2={i + h} y2={h * 0.55}
                        stroke={textColor === "rgba(255,255,255,0.95)" ? "white" : "black"}
                        strokeWidth={0.7} opacity={0.08} />
                );
            }
        }

        return els;
    };

    const patternId = `svgpat-${title.replace(/\s+/g, "")}`;
    const gradId = `svggrad-${title.replace(/\s+/g, "")}`;

    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%", display: "block" }}
            aria-label={`Cover art for ${title}`}
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={lightColor} />
                    <stop offset="55%" stopColor={baseColor} />
                    <stop offset="100%" stopColor={darkColor} />
                </linearGradient>
                <clipPath id={`${patternId}-clip`}>
                    <rect x="0" y="0" width={w} height={h} />
                </clipPath>
            </defs>

            {/* Background gradient */}
            <rect x="0" y="0" width={w} height={h} fill={`url(#${gradId})`} />

            {/* Decorative pattern in upper section */}
            <g clipPath={`url(#${patternId}-clip)`}>
                <rect x="0" y="0" width={w} height={h * 0.57}
                    fill={darkColor} opacity={0.35} />
                {shapes()}
            </g>

            {/* Subtle divider between pattern area and text area */}
            <line
                x1={isLarge ? 14 : 9}
                y1={h * 0.565}
                x2={w - (isLarge ? 14 : 9)}
                y2={h * 0.565}
                stroke={textColor}
                strokeWidth={0.6}
                opacity={0.25}
            />

            {/* Monogram in pattern area */}
            <text
                x={w / 2}
                y={monoY}
                textAnchor="middle"
                dominantBaseline="central"
                fill={textColor}
                fontSize={monoSize}
                fontWeight="800"
                fontFamily="Georgia, serif"
                opacity={0.18}
            >
                {mono}
            </text>

            {/* Small ornament above title */}
            <text
                x={w / 2}
                y={h * 0.595}
                textAnchor="middle"
                fill={textColor}
                fontSize={isLarge ? 8 : 5}
                opacity={0.5}
                fontFamily="Georgia, serif"
            >
                ✦
            </text>

            {/* Title lines */}
            {titleLines.map((line, idx) => (
                <text
                    key={idx}
                    x={w / 2}
                    y={titleY + (isLarge ? 14 : 10) + idx * lineHeight}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    fontSize={titleFontSize}
                    fontWeight="700"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    style={{ letterSpacing: "0.01em" }}
                >
                    {line}
                </text>
            ))}

            {/* Thin decorative line below title */}
            <line
                x1={w / 2 - (isLarge ? 18 : 12)}
                y1={titleY + (isLarge ? 14 : 10) + titleLines.length * lineHeight + (isLarge ? 6 : 4)}
                x2={w / 2 + (isLarge ? 18 : 12)}
                y2={titleY + (isLarge ? 14 : 10) + titleLines.length * lineHeight + (isLarge ? 6 : 4)}
                stroke={textColor}
                strokeWidth={0.5}
                opacity={0.4}
            />

            {/* "The Pen Book" publisher tag at bottom */}
            <text
                x={w / 2}
                y={h - (isLarge ? 10 : 7)}
                textAnchor="middle"
                fill={textColor}
                fontSize={catFontSize}
                fontFamily="'Helvetica Neue', Arial, sans-serif"
                opacity={0.55}
                style={{ letterSpacing: "0.06em" }}
            >
                {category ? category.toUpperCase() : "THE PEN BOOK"}
            </text>
        </svg>
    );
}
