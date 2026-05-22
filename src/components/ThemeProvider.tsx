"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface DayTheme {
  day: number;
  name: string;
  hexColor: string;
  accentColor: string;
  heroHeadline: string;
  active: boolean;
}

interface ThemeContextType {
  theme: DayTheme | null;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  isLoading: true,
});

// Default fallback theme
const DEFAULT_THEME: DayTheme = {
  day: 0,
  name: "Religious Sunday",
  hexColor: "#D4A853",
  accentColor: "#C9956D",
  heroHeadline: "Stories that stay with you!",
  active: true,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dayTheme = useQuery(api.writings.getTodayCategory);
  const [mounted, setMounted] = useState(false);
  
  // Use fallback theme if no theme is found
  const activeTheme = dayTheme || DEFAULT_THEME;

  // Apply theme colors to CSS variables
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;

      // Set primary theme colors
      root.style.setProperty("--color-primary", activeTheme.hexColor);
      root.style.setProperty("--color-accent-theme", activeTheme.accentColor);

      // Derive text color based on primary color brightness
      const textColor = getContrastColor(activeTheme.hexColor);
      root.style.setProperty("--color-primary-text", textColor);

      // Update accent colors throughout
      root.style.setProperty("--color-accent", activeTheme.accentColor);
    }
  }, [activeTheme, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, isLoading: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access current day's theme
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

/**
 * Calculate contrasting text color (white or black) based on background color
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black text for light backgrounds, white for dark
  return luminance > 0.5 ? "#1a1a1a" : "#ffffff";
}
