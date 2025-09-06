# Theme System Documentation

## Overview

This app uses a comprehensive theme system that provides consistent colors across light and dark modes. All colors should be sourced from the theme system rather than hardcoded.

## Usage

### Basic Usage

```typescript
import { useThemeColors } from "@/hooks/useThemeColor";

function MyComponent() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.primary }}>
      <Text style={{ color: colors.primaryForeground }}>Hello</Text>
    </View>
  );
}
```

### Using Themed Components

```typescript
import { ThemedText, ThemedView } from "@/components";

function MyComponent() {
  return (
    <ThemedView variant="surface">
      <ThemedText type="title">Title</ThemedText>
      <ThemedText variant="secondary">Subtitle</ThemedText>
    </ThemedView>
  );
}
```

## Available Colors

### Primary Colors

- `primary` - Main brand color
- `primaryForeground` - Text color for primary backgrounds
- `secondary` - Secondary brand color
- `secondaryForeground` - Text color for secondary backgrounds

### Background Colors

- `background` - Main background color
- `backgroundSecondary` - Secondary background color
- `backgroundTertiary` - Tertiary background color

### Text Colors

- `text` - Primary text color
- `textSecondary` - Secondary text color
- `textTertiary` - Tertiary text color
- `textInverse` - Text color for dark backgrounds

### Surface Colors

- `surface` - Card/surface background
- `surfaceSecondary` - Secondary surface
- `surfaceTertiary` - Tertiary surface

### Semantic Colors

- `success` - Success state color
- `successBackground` - Success background
- `warning` - Warning state color
- `warningBackground` - Warning background
- `error` - Error state color
- `errorBackground` - Error background

### Interactive Colors

- `tint` - Tint color for active states
- `icon` - Default icon color
- `tabIconDefault` - Default tab icon color
- `tabIconSelected` - Selected tab icon color

### Border Colors

- `border` - Primary border color
- `borderSecondary` - Secondary border color

### Overlay Colors

- `overlay` - Modal overlay
- `overlayLight` - Light overlay

## ThemedView Variants

- `background` (default)
- `surface`
- `surfaceSecondary`
- `surfaceTertiary`
- `backgroundSecondary`
- `backgroundTertiary`

## ThemedText Variants

- `primary` (default)
- `secondary`
- `tertiary`
- `inverse`

## ThemedText Types

- `default`
- `title`
- `defaultSemiBold`
- `subtitle`
- `link`
- `caption`
- `label`

## Best Practices

1. Always use theme colors instead of hardcoded hex values
2. Use semantic color names (e.g., `success`, `error`) for state-based styling
3. Leverage ThemedView and ThemedText components for consistent styling
4. Use variants to create visual hierarchy
5. Test both light and dark modes
