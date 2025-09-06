import { useEffect, useRef, useState } from "react";

export interface AudioLevels {
  levels: number[];
  averageLevel: number;
  peakLevel: number;
}

export function useAudioLevels(
  isRecording: boolean,
  updateInterval: number = 100
) {
  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    levels: [0.1, 0.1, 0.1, 0.1, 0.1],
    averageLevel: 0.1,
    peakLevel: 0.1,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isRecording) {
      // Start generating realistic audio levels
      intervalRef.current = setInterval(() => {
        generateAudioLevels();
      }, updateInterval);
    } else {
      // Stop and reset audio levels
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Gradually fade out the levels
      const fadeOutInterval = setInterval(() => {
        setAudioLevels((prev) => {
          const newLevels = prev.levels.map((level) =>
            Math.max(0.1, level * 0.8)
          );
          const averageLevel =
            newLevels.reduce((sum, level) => sum + level, 0) / newLevels.length;
          const peakLevel = Math.max(...newLevels);

          if (averageLevel <= 0.1) {
            clearInterval(fadeOutInterval);
            return {
              levels: [0.1, 0.1, 0.1, 0.1, 0.1],
              averageLevel: 0.1,
              peakLevel: 0.1,
            };
          }

          return {
            levels: newLevels,
            averageLevel,
            peakLevel,
          };
        });
      }, 50);

      // Clean up fade out after 1 second
      setTimeout(() => {
        clearInterval(fadeOutInterval);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, updateInterval]);

  const generateAudioLevels = () => {
    const now = Date.now();
    lastUpdateRef.current = now;

    // Generate more realistic audio levels with speech-like patterns
    const timeInSeconds = now / 1000;

    // Create different audio patterns
    const speechPattern =
      Math.sin(timeInSeconds * 2) * 0.3 + Math.sin(timeInSeconds * 0.5) * 0.2;
    const breathPattern = Math.sin(timeInSeconds * 0.3) * 0.1;
    const randomNoise = (Math.random() - 0.5) * 0.2;

    // Base level with speech-like characteristics
    const baseLevel = 0.3 + speechPattern + breathPattern + randomNoise;

    // Create 5 bars with realistic frequency response
    const levels = Array.from({ length: 5 }, (_, index) => {
      // Different frequency bands (simulating EQ response)
      const frequencyMultiplier = [0.6, 0.8, 1.2, 0.9, 0.7][index]; // Center frequencies are stronger

      // Each bar has its own phase and frequency
      const barPhase =
        Math.sin(timeInSeconds * (2 + index * 0.5) + index * 0.5) * 0.2;
      const barRandom = (Math.random() - 0.5) * 0.15;

      let level = (baseLevel + barPhase + barRandom) * frequencyMultiplier;

      // Add speech-like bursts (consonants and vowels)
      if (Math.random() < 0.15) {
        const burstIntensity = Math.random() * 0.4 + 0.2;
        level += burstIntensity;
      }

      // Add occasional silence (pauses in speech)
      if (Math.random() < 0.05) {
        level *= 0.3;
      }

      // Clamp between 0.1 and 1.0
      return Math.max(0.1, Math.min(1.0, level));
    });

    const averageLevel =
      levels.reduce((sum, level) => sum + level, 0) / levels.length;
    const peakLevel = Math.max(...levels);

    setAudioLevels({
      levels,
      averageLevel,
      peakLevel,
    });
  };

  return audioLevels;
}
