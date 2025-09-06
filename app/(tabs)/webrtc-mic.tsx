import { ThemedText } from "@/components/ThemedText";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useWebRTC } from "@/hooks/useWebRTC";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WebRTCMicScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const insets = useSafeAreaInsets();

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const voiceMeterAnim = useRef(new Animated.Value(0)).current;
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // New animation values for enhanced UI
  const micButtonScale = useRef(new Animated.Value(1)).current;
  const micButtonRotation = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const headerSlideAnim = useRef(new Animated.Value(0)).current;
  const statusPulseAnim = useRef(new Animated.Value(1)).current;

  const {
    isConnected,
    isConnecting,
    conversationState,
    transcript,
    dataChannel,
    toggleSession,
    startConversation,
    isAISpeaking,
    isUserSpeaking,
  } = useWebRTC();

  // Auto-start conversation when connected
  useEffect(() => {
    if (isConnected && conversationState === "idle" && dataChannel) {
      console.log("🚀 Auto-starting conversation...");
      setTimeout(() => {
        startConversation();
      }, 1000); // Small delay to ensure everything is ready
    }
  }, [isConnected, conversationState, dataChannel, startConversation]);

  // Handle manual scrolling detection
  const handleScroll = useCallback((event: any) => {
    isUserScrolling.current = true;

    // Check if user is near the bottom
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isNearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;

    setShowScrollToBottom(!isNearBottom);

    // Clear existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Reset user scrolling flag after 500ms of inactivity
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 500);
  }, []);

  // Force scroll to bottom function
  const forceScrollToBottom = useCallback(() => {
    if (scrollViewRef.current) {
      try {
        scrollViewRef.current.scrollToEnd({ animated: true });
        setShowScrollToBottom(false);
      } catch (error) {
        console.log("Force scroll error:", error);
      }
    }
  }, []);

  // Debug transcript changes and auto-scroll
  useEffect(() => {
    console.log("📝 Transcript updated:", transcript.length, "items");
    if (transcript.length > 0) {
      transcript.forEach((item, index) => {
        console.log(
          `  ${index}: [${item.role}] ${item.text.substring(0, 50)}${
            item.text.length > 50 ? "..." : ""
          } (final: ${item.final})`
        );
      });

      // Simple scroll to bottom function
      const scrollToBottom = () => {
        if (scrollViewRef.current) {
          try {
            scrollViewRef.current.scrollToEnd({ animated: true });
          } catch (error) {
            console.log("Scroll error:", error);
          }
        }
      };

      // Only auto-scroll if user is not actively scrolling
      if (!isUserScrolling.current) {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          scrollToBottom();
        });

        // Backup scroll attempt
        setTimeout(scrollToBottom, 200);
      }
    }
  }, [transcript]);

  // Enhanced animation effects
  useEffect(() => {
    if (isUserSpeaking || isAISpeaking) {
      // Pulse animation for speaking
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();

      // Voice meter animation
      Animated.loop(
        Animated.timing(voiceMeterAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        })
      ).start();

      // Background glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(backgroundOpacity, {
            toValue: 0.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundOpacity, {
            toValue: 0.05,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
      voiceMeterAnim.setValue(0);
      backgroundOpacity.setValue(0);
    }
  }, [
    isUserSpeaking,
    isAISpeaking,
    pulseAnim,
    waveAnim,
    voiceMeterAnim,
    backgroundOpacity,
  ]);

  // Mic button animations
  useEffect(() => {
    if (isConnected) {
      // Scale animation for connected state
      Animated.spring(micButtonScale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(micButtonRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      micButtonScale.setValue(1);
      micButtonRotation.setValue(0);
    }
  }, [isConnected, micButtonScale, micButtonRotation]);

  // Status pulse animation
  useEffect(() => {
    if (isConnecting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(statusPulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(statusPulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      statusPulseAnim.setValue(1);
    }
  }, [isConnecting, statusPulseAnim]);

  // Header slide animation
  useEffect(() => {
    Animated.timing(headerSlideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [headerSlideAnim]);

  // Auto-scroll when speaking states change
  useEffect(() => {
    if ((isUserSpeaking || isAISpeaking) && !isUserScrolling.current) {
      const scrollToBottom = () => {
        if (scrollViewRef.current) {
          try {
            scrollViewRef.current.scrollToEnd({ animated: true });
          } catch (error) {
            console.log("Speaking scroll error:", error);
          }
        }
      };

      // Single scroll attempt for speaking
      requestAnimationFrame(scrollToBottom);
    }
  }, [isUserSpeaking, isAISpeaking]);

  // Card scale animation
  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: isConnected ? 1 : 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isConnected, cardScale]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const handleToggleSession = async () => {
    try {
      setIsProcessing(true);
      await toggleSession();
    } catch (error) {
      console.error("Error toggling session:", error);
      Alert.alert(
        "Connection Error",
        error instanceof Error ? error.message : "Failed to toggle session",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const micButtonRotationInterpolate = micButtonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const headerSlideInterpolate = headerSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Animated Background Glow */}
      {(isUserSpeaking || isAISpeaking) && (
        <Animated.View
          style={[
            styles.backgroundGlow,
            {
              opacity: backgroundOpacity,
            },
          ]}
        />
      )}

      {/* Enhanced Header Section */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            transform: [{ translateY: headerSlideInterpolate }],
          },
        ]}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Animated.View
                  style={[
                    styles.logoContainer,
                    {
                      transform: [{ scale: statusPulseAnim }],
                    },
                  ]}
                >
                  <IconSymbol name="waveform" size={20} color="#ffffff" />
                </Animated.View>
                <View style={styles.headerInfo}>
                  <ThemedText style={styles.appTitle}>Hello, Sasha</ThemedText>
                  <View style={styles.statusIndicator}>
                    <Animated.View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: isConnected
                            ? "#10b981"
                            : isConnecting
                            ? "#f59e0b"
                            : "#ef4444",
                          transform: [{ scale: statusPulseAnim }],
                        },
                      ]}
                    />
                    <ThemedText style={styles.statusText}>
                      {isConnecting
                        ? "Connecting..."
                        : isConnected
                        ? "Connected"
                        : "Disconnected"}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.headerButton}>
                <IconSymbol name="gearshape" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContentWrapper}>
        <ScrollView
          ref={scrollViewRef}
          style={[styles.scrollView, { marginBottom: 60 + insets.bottom }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={100}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={false}
          bounces={true}
          alwaysBounceVertical={false}
          scrollsToTop={false}
          nestedScrollEnabled={true}
        >
          {/* Conversation Content */}
          {transcript && transcript.length > 0 ? (
            <Animated.View
              style={[
                styles.conversationContainer,
                { transform: [{ scale: cardScale }] },
              ]}
            >
              <TranscriptDisplay
                transcript={transcript}
                style={styles.transcriptDisplay}
              />
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.conversationContainer,
                { transform: [{ scale: cardScale }] },
              ]}
            >
              <TranscriptDisplay
                transcript={transcript}
                style={styles.transcriptDisplay}
              />
            </Animated.View>
          )}
        </ScrollView>
      </View>

      {/* Enhanced Floating Mic Button */}
      <View style={[styles.floatingMicContainer, { bottom: 20 }]}>
        <Animated.View
          style={[
            styles.micButtonWrapper,
            {
              transform: [
                { scale: micButtonScale },
                { rotate: micButtonRotationInterpolate },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.floatingMicButton,
              {
                backgroundColor: isConnected ? "#ef4444" : "#ffffff",
                borderColor: isConnected ? "#ef4444" : "#e5e7eb",
                shadowColor: isConnected ? "#ef4444" : "#000",
              },
            ]}
            onPress={handleToggleSession}
            disabled={isProcessing || isConnecting}
          >
            <LinearGradient
              colors={
                isConnected ? ["#ef4444", "#dc2626"] : ["#ffffff", "#f8fafc"]
              }
              style={styles.micButtonGradient}
            >
              <IconSymbol
                name={isConnected ? "stop.fill" : "mic.fill"}
                size={28}
                color={isConnected ? "#ffffff" : "#6b7280"}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Voice Meter */}
        {(isUserSpeaking || isAISpeaking) && (
          <Animated.View
            style={[
              styles.customVoiceMeter,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={
                isUserSpeaking ? ["#3b82f6", "#1d4ed8"] : ["#8b5cf6", "#7c3aed"]
              }
              style={styles.voiceMeterGradient}
            >
              <View style={styles.voiceMeterBars}>
                {[...Array(12)].map((_, index) => {
                  const animatedHeight = voiceMeterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 6 + Math.sin(index * 0.4) * 16 + 8],
                  });

                  const animatedOpacity = voiceMeterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.9 + Math.sin(index * 0.2) * 0.1],
                  });

                  const animatedScale = voiceMeterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2 + Math.sin(index * 0.3) * 0.1],
                  });

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.voiceBar,
                        {
                          height: animatedHeight,
                          backgroundColor: "#ffffff",
                          opacity: animatedOpacity,
                          transform: [{ scale: animatedScale }],
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <View style={styles.voiceMeterLabel}>
                <ThemedText style={styles.voiceMeterText}>
                  {isUserSpeaking ? "Listening..." : "AI Speaking"}
                </ThemedText>
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity
          style={[styles.scrollToBottomButton, { bottom: 80 }]}
          onPress={forceScrollToBottom}
        >
          <IconSymbol name="arrow.down" size={20} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backgroundGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#3b82f6",
    zIndex: -1,
  },
  mainContentWrapper: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
  },
  headerGradient: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerCard: {
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  conversationContainer: {
    marginBottom: 12,
  },
  transcriptDisplay: {
    minHeight: 200,
  },
  floatingMicContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  micButtonWrapper: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingMicButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  micButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 36,
  },
  customVoiceMeter: {
    flex: 1,
    marginLeft: 20,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceMeterGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceMeterBars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 8,
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 6,
  },
  voiceMeterLabel: {
    position: "absolute",
    bottom: 4,
  },
  voiceMeterText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scrollToBottomButton: {
    position: "absolute",
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
