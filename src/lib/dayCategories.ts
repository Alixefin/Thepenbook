import { api } from "../../convex/_generated/api";

/**
 * Default day categories with suggested colors and themes
 */
export const DEFAULT_DAY_CATEGORIES = [
  {
    day: 0,
    name: "Religious Sunday",
    hexColor: "#D4A853",
    accentColor: "#C9956D",
    heroHeadline: "Divine Reflections on the Holy Day",
    active: true,
  },
  {
    day: 1,
    name: "Monologue Monday",
    hexColor: "#5B8BA0",
    accentColor: "#4A6C7D",
    heroHeadline: "Voices that Echo Through Monday",
    active: true,
  },
  {
    day: 2,
    name: "Train of Thoughts Tuesday",
    hexColor: "#8B6B8B",
    accentColor: "#6D5A6D",
    heroHeadline: "Follow the Mind's Wandering Path",
    active: true,
  },
  {
    day: 3,
    name: "Wisdom Wednesday",
    hexColor: "#C97B84",
    accentColor: "#A85F68",
    heroHeadline: "Insights from Life's Lessons",
    active: true,
  },
  {
    day: 4,
    name: "Fiction Thursday",
    hexColor: "#7D9B76",
    accentColor: "#6A8463",
    heroHeadline: "Tales Spun from Imagination",
    active: true,
  },
  {
    day: 5,
    name: "Fantasy Friday",
    hexColor: "#C4693D",
    accentColor: "#A85230",
    heroHeadline: "Escape Into Magical Worlds",
    active: true,
  },
  {
    day: 6,
    name: "Story Saturday",
    hexColor: "#9D7E5D",
    accentColor: "#7D6245",
    heroHeadline: "Celebrate Storytelling",
    active: true,
  },
];

/**
 * Initialize day categories in Convex database
 * Call this once during setup or on first admin access
 */
export async function initializeDayCategories(apiCalls: typeof api) {
  try {
    for (const dayCategory of DEFAULT_DAY_CATEGORIES) {
      await apiCalls.writings.createDayCategory(dayCategory);
    }
    console.log("Day categories initialized successfully");
  } catch (error) {
    console.error("Error initializing day categories:", error);
  }
}
