/**
 * Generate a URL-friendly slug from a title.
 * "My First Story" → "my-first-story"
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Collapse multiple hyphens
        .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Format a Convex _creationTime (ms timestamp) into a readable date.
 */
export function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Default categories — users can add custom ones via settings.
 */
export const DEFAULT_CATEGORIES = [
    "Short Stories",
    "Novel",
    "Train of Thoughts",
];

/**
 * Color tag presets.
 */
export const COLOR_PRESETS = [
    { name: "Gold", hex: "#D4A853" },
    { name: "Rose", hex: "#C97B84" },
    { name: "Sage", hex: "#7D9B76" },
    { name: "Ocean", hex: "#5B8BA0" },
    { name: "Plum", hex: "#8B6B8B" },
    { name: "Ember", hex: "#C4693D" },
];

/**
 * Check if a writing is "new" (created within last 48 hours).
 */
export function isNewWriting(creationTime: number): boolean {
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    return Date.now() - creationTime < FORTY_EIGHT_HOURS;
}

/**
 * Check if a writing was recently updated (within last 48 hours,
 * and more than 1 minute after creation to avoid initial save).
 */
export function isRecentlyUpdated(
    creationTime: number,
    updatedAt?: number
): boolean {
    if (!updatedAt) return false;
    const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
    const ONE_MINUTE = 60 * 1000;
    return (
        Date.now() - updatedAt < FORTY_EIGHT_HOURS &&
        updatedAt - creationTime > ONE_MINUTE
    );
}
