"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type ColorMode = "monochrome" | "multicolor" | "custom";

interface ColorModeContextType {
  colorMode: ColorMode;
  accentColor: string;
  setColorMode: (mode: ColorMode) => void;
  setAccentColor: (color: string) => void;
  getPlayerColor: (index: number, isDarkMode: boolean) => string;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(
  undefined,
);

const STORAGE_KEY_MODE = "badminton_color_mode";
const STORAGE_KEY_ACCENT = "badminton_accent_color";

// Predefined multicolor palette
const MULTICOLOR_PALETTE = [
  "hsl(220, 70%, 50%)", // Blue
  "hsl(340, 75%, 55%)", // Pink
  "hsl(160, 60%, 45%)", // Teal
  "hsl(45, 90%, 50%)", // Yellow
  "hsl(280, 65%, 55%)", // Purple
  "hsl(15, 80%, 55%)", // Orange
  "hsl(195, 70%, 50%)", // Cyan
  "hsl(100, 50%, 45%)", // Green
  "hsl(330, 60%, 50%)", // Magenta
  "hsl(60, 70%, 45%)", // Lime
];

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>("monochrome");
  const [accentColor, setAccentColorState] =
    useState<string>("hsl(220, 70%, 50%)");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load from localStorage on mount
    const storedMode = localStorage.getItem(STORAGE_KEY_MODE) as ColorMode;
    const storedAccent = localStorage.getItem(STORAGE_KEY_ACCENT);

    if (
      storedMode &&
      ["monochrome", "multicolor", "custom"].includes(storedMode)
    ) {
      setColorModeState(storedMode);
    }
    if (storedAccent) {
      setAccentColorState(storedAccent);
    }
    setMounted(true);
  }, []);

  // Apply custom-accent class and CSS variables when custom mode is active
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (colorMode === "custom") {
      root.classList.add("custom-accent");

      // Parse HSL and create selection background colors
      const hslMatch = accentColor.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
      if (hslMatch) {
        const [, h, s] = hslMatch;
        // Light mode: semi-transparent accent for selection
        root.style.setProperty(
          "--selection-bg-light",
          `hsla(${h}, ${s}%, 50%, 0.35)`,
        );
        // Dark mode: darker version of accent for selection
        root.style.setProperty(
          "--selection-bg-dark",
          `hsla(${h}, ${s}%, 45%, 0.5)`,
        );
      }
    } else {
      root.classList.remove("custom-accent");
      root.style.removeProperty("--selection-bg-light");
      root.style.removeProperty("--selection-bg-dark");
    }

    return () => {
      root.classList.remove("custom-accent");
      root.style.removeProperty("--selection-bg-light");
      root.style.removeProperty("--selection-bg-dark");
    };
  }, [colorMode, accentColor, mounted]);

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem(STORAGE_KEY_ACCENT, color);
  };

  const getPlayerColor = (index: number, isDarkMode: boolean): string => {
    const maxPlayers = 10;
    const clampedIndex = Math.min(index, maxPlayers - 1);

    switch (colorMode) {
      case "multicolor":
        return MULTICOLOR_PALETTE[clampedIndex % MULTICOLOR_PALETTE.length];

      case "custom": {
        // Parse the accent color and create opacity variations
        // Extract HSL values from the accent color
        const hslMatch = accentColor.match(
          /hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/,
        );
        if (hslMatch) {
          const [, h, s, l] = hslMatch;
          // Vary lightness based on index - top players get more prominent colors
          const baseLightness = parseInt(l);
          const lightnessOffset = isDarkMode
            ? -(clampedIndex * 5) // Darker for higher indices in dark mode
            : clampedIndex * 5; // Lighter for higher indices in light mode
          const newLightness = Math.max(
            20,
            Math.min(80, baseLightness + lightnessOffset),
          );
          return `hsl(${h}, ${s}%, ${newLightness}%)`;
        }
        // Fallback to using the accent color directly with opacity
        return accentColor;
      }

      case "monochrome":
      default:
        // Original monochrome implementation
        return isDarkMode
          ? `hsl(0, 0%, ${90 - clampedIndex * 6}%)` // 90% to 36%
          : `hsl(0, 0%, ${10 + clampedIndex * 7}%)`; // 10% to 73%
    }
  };

  return (
    <ColorModeContext.Provider
      value={{
        colorMode,
        accentColor,
        setColorMode,
        setAccentColor,
        getPlayerColor,
      }}
    >
      {children}
    </ColorModeContext.Provider>
  );
}

// Default fallback for SSR or when provider is not available
const defaultGetPlayerColor = (index: number, isDarkMode: boolean): string => {
  const maxPlayers = 10;
  const clampedIndex = Math.min(index, maxPlayers - 1);
  return isDarkMode
    ? `hsl(0, 0%, ${90 - clampedIndex * 6}%)`
    : `hsl(0, 0%, ${10 + clampedIndex * 7}%)`;
};

export function useColorMode() {
  const context = useContext(ColorModeContext);
  // Return defaults if context not available (SSR or missing provider)
  if (context === undefined) {
    return {
      colorMode: "monochrome" as ColorMode,
      accentColor: "hsl(220, 70%, 50%)",
      setColorMode: () => {},
      setAccentColor: () => {},
      getPlayerColor: defaultGetPlayerColor,
    };
  }
  return context;
}