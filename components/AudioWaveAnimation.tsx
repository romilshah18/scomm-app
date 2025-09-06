import { useAudioLevels } from "@/hooks/useAudioLevels";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface AudioWaveAnimationProps {
  isRecording: boolean;
  width?: number;
  height?: number;
}

export function AudioWaveAnimation({
  isRecording,
  width = 300,
  height = 120,
}: AudioWaveAnimationProps) {
  const audioLevels = useAudioLevels(isRecording, 60); // Faster updates for smoother waves

  // Create multiple wave layers with more bars for full width
  const barCount = Math.floor(width / 4); // More bars for full width
  const wave1Values = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.1))
  ).current;
  const wave2Values = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.1))
  ).current;
  const wave3Values = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    if (isRecording) {
      // Generate wave patterns for each layer
      const generateWavePattern = (
        values: Animated.Value[],
        offset: number,
        frequency: number
      ) => {
        values.forEach((animatedValue, index) => {
          const time = Date.now() / 1000;
          const baseLevel = audioLevels.averageLevel;
          const wavePattern =
            Math.sin(time * frequency + index * 0.3 + offset) * 0.3;
          const targetLevel = Math.max(
            0.1,
            Math.min(1.0, baseLevel + wavePattern)
          );

          Animated.timing(animatedValue, {
            toValue: targetLevel,
            duration: 60,
            useNativeDriver: false,
          }).start();
        });
      };

      // Create three overlapping wave layers
      generateWavePattern(wave1Values, 0, 2.5); // Primary wave
      generateWavePattern(wave2Values, Math.PI / 3, 1.8); // Secondary wave
      generateWavePattern(wave3Values, Math.PI / 2, 3.2); // Tertiary wave
    } else {
      // Fade out all waves
      [...wave1Values, ...wave2Values, ...wave3Values].forEach(
        (animatedValue) => {
          Animated.timing(animatedValue, {
            toValue: 0.1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      );
    }
  }, [
    isRecording,
    audioLevels.averageLevel,
    wave1Values,
    wave2Values,
    wave3Values,
  ]);

  const renderWaveLayer = (
    values: Animated.Value[],
    color: string,
    opacity: number
  ) => (
    <View style={[styles.waveContainer, { width, height }]}>
      {values.map((animatedValue, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              backgroundColor: color,
              opacity: opacity,
              height: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.05, height * 0.9],
              }),
              transform: [
                {
                  scaleY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Background wave layer - lighter purple */}
      {renderWaveLayer(wave3Values, "#E8D5FF", 0.4)}

      {/* Middle wave layer - medium purple */}
      {renderWaveLayer(wave2Values, "#C084FC", 0.6)}

      {/* Foreground wave layer - darker purple */}
      {renderWaveLayer(wave1Values, "#9333EA", 0.8)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  waveContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  waveBar: {
    width: 2,
    borderRadius: 1,
    minHeight: 4,
  },
});
