/**
 * Comprehensive theme system for the app
 * All colors used throughout the app should come from this theme
 */

// Primary brand colors
const primaryLight = "#007AFF";
const primaryDark = "#0A84FF";
const secondaryLight = "#5856D6";
const secondaryDark = "#5E5CE6";

// Semantic colors
const successLight = "#34C759";
const successDark = "#30D158";
const warningLight = "#FF9500";
const warningDark = "#FF9F0A";
const errorLight = "#FF3B30";
const errorDark = "#FF453A";

// Neutral colors
const gray50 = "#F9FAFB";
const gray100 = "#F3F4F6";
const gray200 = "#E5E7EB";
const gray300 = "#D1D5DB";
const gray400 = "#9CA3AF";
const gray500 = "#6B7280";
const gray600 = "#4B5563";
const gray700 = "#374151";
const gray800 = "#1F2937";
const gray900 = "#111827";

export const Colors = {
  light: {
    // Primary colors
    primary: primaryLight,
    primaryForeground: "#FFFFFF",
    secondary: secondaryLight,
    secondaryForeground: "#FFFFFF",

    // Background colors
    background: "#FFFFFF",
    backgroundSecondary: gray50,
    backgroundTertiary: gray100,

    // Text colors
    text: gray900,
    textSecondary: gray600,
    textTertiary: gray500,
    textInverse: "#FFFFFF",

    // Border colors
    border: gray200,
    borderSecondary: gray300,

    // Interactive colors
    tint: primaryLight,
    icon: gray500,
    tabIconDefault: gray400,
    tabIconSelected: primaryLight,

    // Semantic colors
    success: successLight,
    successBackground: "#D1FAE5",
    warning: warningLight,
    warningBackground: "#FEF3C7",
    error: errorLight,
    errorBackground: "#FEE2E2",

    // Surface colors
    surface: "#FFFFFF",
    surfaceSecondary: gray50,
    surfaceTertiary: gray100,

    // Overlay colors
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.1)",
  },
  dark: {
    // Primary colors
    primary: primaryDark,
    primaryForeground: "#FFFFFF",
    secondary: secondaryDark,
    secondaryForeground: "#FFFFFF",

    // Background colors
    background: gray900,
    backgroundSecondary: gray800,
    backgroundTertiary: gray700,

    // Text colors
    text: "#FFFFFF",
    textSecondary: gray300,
    textTertiary: gray400,
    textInverse: gray900,

    // Border colors
    border: gray700,
    borderSecondary: gray600,

    // Interactive colors
    tint: primaryDark,
    icon: gray400,
    tabIconDefault: gray500,
    tabIconSelected: primaryDark,

    // Semantic colors
    success: successDark,
    successBackground: "#064E3B",
    warning: warningDark,
    warningBackground: "#451A03",
    error: errorDark,
    errorBackground: "#450A0A",

    // Surface colors
    surface: gray800,
    surfaceSecondary: gray700,
    surfaceTertiary: gray600,

    // Overlay colors
    overlay: "rgba(0, 0, 0, 0.7)",
    overlayLight: "rgba(0, 0, 0, 0.3)",
  },
};

// Export color names for easy access
export const ColorNames = {
  // Primary
  PRIMARY: "primary" as const,
  PRIMARY_FOREGROUND: "primaryForeground" as const,
  SECONDARY: "secondary" as const,
  SECONDARY_FOREGROUND: "secondaryForeground" as const,

  // Background
  BACKGROUND: "background" as const,
  BACKGROUND_SECONDARY: "backgroundSecondary" as const,
  BACKGROUND_TERTIARY: "backgroundTertiary" as const,

  // Text
  TEXT: "text" as const,
  TEXT_SECONDARY: "textSecondary" as const,
  TEXT_TERTIARY: "textTertiary" as const,
  TEXT_INVERSE: "textInverse" as const,

  // Border
  BORDER: "border" as const,
  BORDER_SECONDARY: "borderSecondary" as const,

  // Interactive
  TINT: "tint" as const,
  ICON: "icon" as const,
  TAB_ICON_DEFAULT: "tabIconDefault" as const,
  TAB_ICON_SELECTED: "tabIconSelected" as const,

  // Semantic
  SUCCESS: "success" as const,
  SUCCESS_BACKGROUND: "successBackground" as const,
  WARNING: "warning" as const,
  WARNING_BACKGROUND: "warningBackground" as const,
  ERROR: "error" as const,
  ERROR_BACKGROUND: "errorBackground" as const,

  // Surface
  SURFACE: "surface" as const,
  SURFACE_SECONDARY: "surfaceSecondary" as const,
  SURFACE_TERTIARY: "surfaceTertiary" as const,

  // Overlay
  OVERLAY: "overlay" as const,
  OVERLAY_LIGHT: "overlayLight" as const,
};
