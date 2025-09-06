import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RTCView } from "react-native-webrtc";

interface ConditionalRTCViewProps {
  streamURL?: string;
  style?: any;
  mirror?: boolean;
  objectFit?: "cover" | "contain";
  fallbackText?: string;
}

export function ConditionalRTCView({
  streamURL,
  style,
  mirror = false,
  objectFit = "cover",
  fallbackText = "Stream Preview",
}: ConditionalRTCViewProps) {
  try {
    // Try to render the real RTCView
    if (streamURL) {
      return (
        <RTCView
          style={style}
          streamURL={streamURL}
          mirror={mirror}
          objectFit={objectFit}
        />
      );
    }
  } catch {
    // Fall back to a placeholder view if RTCView is not available
    console.log("RTCView not available, using fallback");
  }

  // Fallback view when WebRTC is not available
  return (
    <View style={[style, styles.fallbackContainer]}>
      <Text style={styles.fallbackText}>{fallbackText}</Text>
      <Text style={styles.fallbackSubtext}>
        WebRTC not available in Expo Go
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  fallbackSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
