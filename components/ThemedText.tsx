import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor, useThemeColors } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "defaultSemiBold"
    | "subtitle"
    | "link"
    | "caption"
    | "label";
  variant?: "primary" | "secondary" | "tertiary" | "inverse";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  variant = "primary",
  ...rest
}: ThemedTextProps) {
  // Determine color based on variant
  let colorKey: keyof ReturnType<typeof useThemeColors>;
  switch (variant) {
    case "secondary":
      colorKey = "textSecondary";
      break;
    case "tertiary":
      colorKey = "textTertiary";
      break;
    case "inverse":
      colorKey = "textInverse";
      break;
    default:
      colorKey = "text";
  }

  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "label" ? styles.label : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 28,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontWeight: "500",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});
