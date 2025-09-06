import { useThemeColors } from "@/hooks/useThemeColor";
import { TranscriptItem } from "@/hooks/useTranscript";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface TranscriptDisplayProps {
  transcript: TranscriptItem[];
  style?: any;
}

export function TranscriptDisplay({
  transcript,
  style,
}: TranscriptDisplayProps) {
  const colors = useThemeColors();

  // Debug: Log transcript changes
  React.useEffect(() => {
    console.log(
      "TranscriptDisplay: transcript updated",
      transcript.length,
      "items"
    );
    transcript.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        role: item.role,
        text: item.text.substring(0, 50) + (item.text.length > 50 ? "..." : ""),
        final: item.final,
        id: item.id,
      });
    });
  }, [transcript]);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderTranscriptItem = (item: TranscriptItem, index: number) => {
    const isUser = item.role === "user";
    const isFinal = item.final;

    return (
      <ThemedView
        key={`${item.role}-${index}-${item.final ? "final" : "typing"}-${
          item.text.length
        }`}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.aiMessage,
          { backgroundColor: isUser ? colors.primary : colors.surface },
        ]}
      >
        <View style={styles.messageHeader}>
          <ThemedText
            type="caption"
            style={[
              styles.roleText,
              { color: isUser ? colors.primaryForeground : colors.text },
            ]}
          >
            {isUser ? "You" : "AI"}
          </ThemedText>
          {item.timestamp && (
            <ThemedText
              type="caption"
              style={[
                styles.timestampText,
                { color: isUser ? colors.primaryForeground : colors.text },
              ]}
            >
              {formatTimestamp(item.timestamp)}
            </ThemedText>
          )}
        </View>
        <ThemedText
          style={[
            styles.messageText,
            { color: isUser ? colors.primaryForeground : colors.text },
            !isFinal && styles.typingText,
          ]}
        >
          {item.text}
          {!isFinal && <ThemedText style={styles.cursor}>|</ThemedText>}
        </ThemedText>
      </ThemedView>
    );
  };

  if (transcript.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <View style={styles.emptyMessageCard}>
          <View style={styles.emptyIconContainer}>
            <IconSymbol name="mic.fill" size={32} color="#667eea" />
          </View>
          <ThemedText style={styles.emptyTitle}>Voice Assistant</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Tap the mic and let your voice guide the conversation
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {transcript.map((item, index) => renderTranscriptItem(item, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 200,
    backgroundColor: "transparent",
  },
  emptyMessageCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    maxWidth: 320,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(102, 126, 234, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyIcon: {
    fontSize: 40,
    color: "#475569",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    opacity: 0.9,
  },
  messageContainer: {
    marginBottom: 6,
    padding: 10,
    borderRadius: 12,
    maxWidth: "85%",
  },
  userMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  roleText: {
    fontWeight: "600",
    fontSize: 12,
  },
  timestampText: {
    fontSize: 10,
    opacity: 0.7,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingText: {
    fontStyle: "italic",
  },
  cursor: {
    opacity: 0.7,
  },
});
