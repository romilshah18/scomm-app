import { AudioRecorder, requestRecordingPermissionsAsync } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

export interface RecordingState {
  isRecording: boolean;
  hasPermission: boolean | null;
  recording: AudioRecorder | null;
  duration: number;
}

export function useMicrophone() {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    hasPermission: null,
    recording: null,
    duration: 0,
  });

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<AudioRecorder | null>(null);

  useEffect(() => {
    requestPermissions();

    return () => {
      // Cleanup on unmount
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      // Stop any active recording
      if (recordingRef.current) {
        recordingRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await requestRecordingPermissionsAsync();
      setRecordingState((prev) => ({
        ...prev,
        hasPermission: status === "granted",
      }));

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant microphone permission to use this feature.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      setRecordingState((prev) => ({
        ...prev,
        hasPermission: false,
      }));
    }
  };

  const startRecording = async () => {
    if (recordingState.hasPermission === false) {
      await requestPermissions();
      return;
    }

    // Prevent multiple recording instances
    if (recordingState.isRecording || recordingState.recording) {
      console.log("Recording already in progress");
      return;
    }

    try {
      // Stop any existing recording first
      if (recordingRef.current) {
        recordingRef.current.stop();
        recordingRef.current = null;
        setRecordingState((prev) => ({ ...prev, recording: null }));
      }

      const recording = new AudioRecorder({
        android: {
          extension: ".m4a",
          outputFormat: "mpeg4",
          audioEncoder: "aac",
          sampleRate: 44100,
        },
        ios: {
          extension: ".m4a",
          outputFormat: "mpeg4aac",
          audioQuality: 1, // High quality
          sampleRate: 44100,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      });

      recording.record();

      recordingRef.current = recording;
      setRecordingState((prev) => ({
        ...prev,
        recording,
        isRecording: true,
        duration: 0,
      }));

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setRecordingState((prev) => ({
        ...prev,
        isRecording: false,
        recording: null,
      }));

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert(
        "Recording Error",
        `Failed to start recording: ${errorMessage}`,
        [{ text: "OK" }]
      );
    }
  };

  const stopRecording = async () => {
    if (!recordingState.recording) return;

    try {
      setRecordingState((prev) => ({
        ...prev,
        isRecording: false,
      }));

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      await recordingState.recording.stop();
      const uri = recordingState.recording.uri;
      console.log("Recording saved to:", uri);

      const finalDuration = recordingState.duration;

      recordingRef.current = null;
      setRecordingState((prev) => ({
        ...prev,
        recording: null,
        duration: 0,
      }));

      Alert.alert(
        "Recording Complete",
        `Recording saved successfully! Duration: ${formatDuration(
          finalDuration
        )}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to stop recording:", error);

      // Clean up state even if stopping fails
      recordingRef.current = null;
      setRecordingState((prev) => ({
        ...prev,
        isRecording: false,
        recording: null,
        duration: 0,
      }));

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert(
        "Recording Error",
        `Failed to stop recording: ${errorMessage}`,
        [{ text: "OK" }]
      );
    }
  };

  const toggleRecording = () => {
    if (recordingState.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    ...recordingState,
    startRecording,
    stopRecording,
    toggleRecording,
    requestPermissions,
    formatDuration: () => formatDuration(recordingState.duration),
  };
}
