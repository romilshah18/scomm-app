import { View, type ViewProps } from "react-native";

import { useThemeColor, useThemeColors } from "@/hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?:
    | "background"
    | "surface"
    | "surfaceSecondary"
    | "surfaceTertiary"
    | "backgroundSecondary"
    | "backgroundTertiary";
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  variant = "background",
  ...otherProps
}: ThemedViewProps) {
  // Determine background color based on variant
  let colorKey: keyof ReturnType<typeof useThemeColors>;
  switch (variant) {
    case "surface":
      colorKey = "surface";
      break;
    case "surfaceSecondary":
      colorKey = "surfaceSecondary";
      break;
    case "surfaceTertiary":
      colorKey = "surfaceTertiary";
      break;
    case "backgroundSecondary":
      colorKey = "backgroundSecondary";
      break;
    case "backgroundTertiary":
      colorKey = "backgroundTertiary";
      break;
    default:
      colorKey = "background";
  }

  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    colorKey
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
