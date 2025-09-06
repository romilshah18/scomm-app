/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

// Convenience hook for getting theme colors without props
export function useThemeColors() {
  const theme = useColorScheme() ?? "light";
  return Colors[theme];
}

// Type-safe color name helper
export type ThemeColorName = keyof typeof Colors.light &
  keyof typeof Colors.dark;
