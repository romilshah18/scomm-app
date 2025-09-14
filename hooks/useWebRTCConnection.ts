import { ENV, validateEnv } from "@/config/env";
import { logger } from "@/utils/logger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  MediaStream,
  RTCPeerConnection,
  mediaDevices,
} from "react-native-webrtc";
import { AudioManager } from "./useInCallManager";
import { TranscriptItem } from "./useTranscript";

// Error classification for better error handling
export type ErrorSeverity = "warning" | "error" | "fatal";

export interface ConnectionError {
  message: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  timestamp: number;
}

export interface WebRTCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  hasPermission: boolean | null;
  error: string | null; // Only fatal errors shown to UI
  warning: string | null; // Recoverable warnings (log only)
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  dataChannel: any | null;
  conversationState: "idle" | "user_speaking" | "ai_speaking" | "processing";
  audioLevel: number;
  transcript: TranscriptItem[];
  // Derived state values (computed from conversationState)
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  isProcessing: boolean;
  isIdle: boolean;
}

export interface WebRTCConnectionActions {
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  toggleSession: () => Promise<void>;
  sendMessage: (message: any) => void;
  startConversation: () => void;
  stopConversation: () => void;
  sendUserInput: (input: string) => void;
  clearTranscript: () => void;
}

export function useWebRTCConnection(): WebRTCConnectionState &
  WebRTCConnectionActions {
  const [state, setState] = useState<WebRTCConnectionState>({
    isConnected: false,
    isConnecting: false,
    hasPermission: null,
    error: null,
    warning: null,
    localStream: null,
    remoteStream: null,
    dataChannel: null,
    conversationState: "idle",
    audioLevel: 0,
    transcript: [],
    // Derived state values
    isAISpeaking: false,
    isUserSpeaking: false,
    isProcessing: false,
    isIdle: true,
  });

  // Consolidated refs for better management
  const refs = useRef({
    peerConnection: null as RTCPeerConnection | null,
    localStream: null as MediaStream | null,
    dataChannel: null as any | null,
    conversationTimeout: null as ReturnType<typeof setTimeout> | null,
    sessionId: null as string | null,
    apiKeyValidated: false as boolean,
    isResponseInProgress: false as boolean,
  });

  // Simplified transcript buffering
  const transcriptFlushTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const pendingTranscriptUpdatesRef = useRef<{
    userDelta: string;
    aiDelta: string;
    items: TranscriptItem[];
  }>({ userDelta: "", aiDelta: "", items: [] });

  // Error handling utilities
  const handleError = useCallback((error: ConnectionError) => {
    const timestamp = Date.now();
    const errorWithTimestamp = { ...error, timestamp };

    logger.error(
      `[${error.severity.toUpperCase()}] ${error.message}`,
      errorWithTimestamp
    );

    if (error.severity === "fatal") {
      setState((prev) => ({
        ...prev,
        error: error.message,
        conversationState: "idle",
      }));
    } else if (error.severity === "warning") {
      setState((prev) => ({
        ...prev,
        warning: error.message,
      }));
      // Clear warning after 5 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, warning: null }));
      }, 5000);
    }
  }, []);

  // State derivation functions (eliminates redundant state)
  const isAISpeaking = state.conversationState === "ai_speaking";
  const isUserSpeaking = state.conversationState === "user_speaking";
  const isProcessing = state.conversationState === "processing";
  const isIdle = state.conversationState === "idle";

  // Transcript management function
  const clearTranscript = useCallback(() => {
    // Clear buffers and timeouts
    pendingTranscriptUpdatesRef.current = {
      userDelta: "",
      aiDelta: "",
      items: [],
    };
    if (transcriptFlushTimeoutRef.current) {
      clearTimeout(transcriptFlushTimeoutRef.current);
      transcriptFlushTimeoutRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      transcript: [],
    }));
  }, []);

  // Flush transcript buffer to state (batched update)
  const flushTranscriptBuffer = useCallback(() => {
    const pending = pendingTranscriptUpdatesRef.current;
    if (
      pending.items.length === 0 &&
      pending.userDelta === "" &&
      pending.aiDelta === ""
    ) {
      return; // Nothing to flush
    }

    console.log("🔄 Flushing transcript buffer:", {
      userDelta: pending.userDelta,
      aiDelta: pending.aiDelta,
      bufferItems: pending.items.length,
    });

    setState((prev) => {
      const newTranscript = [...prev.transcript];

      // Add any buffered transcript items
      pending.items.forEach((item) => {
        newTranscript.push(item);
      });

      // ONLY process user deltas in this flush
      if (pending.userDelta) {
        const lastUserIndex = newTranscript.findLastIndex(
          (item) => item.role === "user" && !item.final
        );
        if (lastUserIndex !== -1) {
          newTranscript[lastUserIndex].text += pending.userDelta;
        } else {
          // Only create new user item if no user item exists
          newTranscript.push({
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: "user",
            text: pending.userDelta,
            final: false,
            timestamp: Date.now(),
          });
        }
      }

      // Clear only user delta, keep AI delta for separate processing
      pendingTranscriptUpdatesRef.current = {
        userDelta: "",
        aiDelta: pending.aiDelta, // Keep AI delta for later
        items: [],
      };

      console.log(
        "✅ User transcript updated:",
        newTranscript.map((item) => ({
          role: item.role,
          text:
            item.text.substring(0, 30) + (item.text.length > 30 ? "..." : ""),
          final: item.final,
        }))
      );

      return { ...prev, transcript: newTranscript };
    });
  }, []);

  // Separate function to flush AI deltas only after user is finalized
  const flushAITranscriptBuffer = useCallback(() => {
    const pending = pendingTranscriptUpdatesRef.current;
    if (pending.aiDelta === "") {
      return; // Nothing to flush
    }

    console.log("🔄 Flushing AI transcript buffer:", {
      aiDelta: pending.aiDelta,
    });

    setState((prev) => {
      const newTranscript = [...prev.transcript];

      // Check if there's a final user message before adding AI response
      const hasFinalUserMessage = newTranscript.some(
        (item) => item.role === "user" && item.final
      );

      if (!hasFinalUserMessage) {
        console.log("⏳ Deferring AI transcript - no final user message yet");
        return prev;
      }

      const lastAIIndex = newTranscript.findLastIndex(
        (item) => item.role === "assistant" && !item.final
      );
      if (lastAIIndex !== -1) {
        newTranscript[lastAIIndex].text += pending.aiDelta;
      } else {
        newTranscript.push({
          id: `assistant-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          role: "assistant",
          text: pending.aiDelta,
          final: false,
          timestamp: Date.now(),
        });
      }

      // Clear AI delta
      pendingTranscriptUpdatesRef.current = {
        userDelta: "",
        aiDelta: "",
        items: [],
      };

      console.log(
        "✅ AI transcript updated:",
        newTranscript.map((item) => ({
          role: item.role,
          text:
            item.text.substring(0, 30) + (item.text.length > 30 ? "..." : ""),
          final: item.final,
        }))
      );

      return { ...prev, transcript: newTranscript };
    });
  }, []);

  // Schedule transcript flush with debouncing
  const scheduleTranscriptFlush = useCallback(() => {
    // Clear existing timeout
    if (transcriptFlushTimeoutRef.current) {
      clearTimeout(transcriptFlushTimeoutRef.current);
    }

    // Schedule new flush
    transcriptFlushTimeoutRef.current = setTimeout(() => {
      flushTranscriptBuffer();
      transcriptFlushTimeoutRef.current = null;
    }, 100); // 100ms debounce
  }, [flushTranscriptBuffer]);

  // Normalized event types for internal state management
  type NormalizedEventType =
    | "user_speaking_started"
    | "user_speaking_stopped"
    | "ai_speaking_started"
    | "ai_speaking_stopped"
    | "user_transcription_delta"
    | "user_transcription_completed"
    | "ai_transcription_delta"
    | "ai_transcription_completed"
    | "error"
    | "unknown";

  // Event mapping for O(1) lookups (moved outside component to avoid recreation)
  const eventTypeMap = useMemo(
    () =>
      new Map<string, NormalizedEventType>([
        // User speaking events
        [
          "conversation.item.input_audio_buffer.speech_started",
          "user_speaking_started",
        ],
        ["input_audio_buffer.speech_started", "user_speaking_started"],
        [
          "conversation.item.input_audio_buffer.speech_stopped",
          "user_speaking_stopped",
        ],
        ["input_audio_buffer.speech_stopped", "user_speaking_stopped"],

        // AI speaking events
        [
          "conversation.item.output_audio_buffer.speech_started",
          "ai_speaking_started",
        ],
        [
          "conversation.item.output_audio_buffer.audio_added",
          "ai_speaking_started",
        ],
        ["output_audio_buffer.started", "ai_speaking_started"],
        [
          "conversation.item.output_audio_buffer.speech_stopped",
          "ai_speaking_stopped",
        ],
        ["conversation.item.output_audio_buffer.done", "ai_speaking_stopped"],
        ["output_audio_buffer.stopped", "ai_speaking_stopped"],
        ["response.audio.done", "ai_speaking_stopped"],
        ["response.done", "ai_speaking_stopped"],
        ["response.cancelled", "ai_speaking_stopped"],
        ["response.content_part.done", "ai_speaking_stopped"],
        ["response.output_item.done", "ai_speaking_stopped"],

        // Transcription events
        [
          "conversation.item.input_audio_transcription.delta",
          "user_transcription_delta",
        ],
        ["input_audio_transcription.delta", "user_transcription_delta"],
        [
          "conversation.item.input_audio_transcription.completed",
          "user_transcription_completed",
        ],
        ["input_audio_transcription.completed", "user_transcription_completed"],
        ["response.audio_transcript.delta", "ai_transcription_delta"],
        ["response.audio_transcript.done", "ai_transcription_completed"],

        // Error events
        ["error", "error"],
      ]),
    []
  );

  // Event normalizer - maps OpenAI events to internal normalized events
  const normalizeEvent = useCallback(
    (message: any): { type: NormalizedEventType; data: any } => {
      const eventType = message.type;
      const normalizedType = eventTypeMap.get(eventType);

      if (normalizedType) {
        return { type: normalizedType, data: message };
      }

      // Logging-only events (no state changes needed)
      if (
        eventType === "conversation.item.output_audio_buffer.committed" ||
        eventType === "response.audio.delta" ||
        eventType === "response.text.delta" ||
        eventType === "response.text.done"
      ) {
        logger.debug("Logging-only event", { type: eventType });
        return { type: "unknown", data: message };
      }

      return { type: "unknown", data: message };
    },
    [eventTypeMap]
  );

  // Normalized event handlers
  const handleUserSpeakingStarted = useCallback(() => {
    logger.info("User started speaking - setting user turn");
    setState((prev) => ({
      ...prev,
      conversationState: "user_speaking",
    }));
    // Stop any active TTS so the model yields to the user
    if (
      refs.current.dataChannel &&
      refs.current.dataChannel.readyState === "open"
    ) {
      refs.current.dataChannel.send(
        JSON.stringify({ type: "response.cancel" })
      );
    }
  }, []);

  const handleUserSpeakingStopped = useCallback(() => {
    setState((prev) => ({
      ...prev,
      conversationState: "processing",
    }));
  }, []);

  const handleAISpeakingStarted = useCallback((message: any) => {
    if (refs.current.isResponseInProgress) {
      logger.warn(
        "Response already in progress - ignoring duplicate speech_started"
      );
      return;
    }

    refs.current.isResponseInProgress = true;
    logger.info("AI started speaking - setting AI turn");

    // Set a timeout as fallback (OpenAI events are primary signal)
    if (refs.current.conversationTimeout) {
      clearTimeout(refs.current.conversationTimeout);
    }
    refs.current.conversationTimeout = setTimeout(() => {
      logger.warn("AI speaking timeout - resetting to user turn (fallback)");
      refs.current.isResponseInProgress = false;
      setState((prev) => ({
        ...prev,
        conversationState: "idle",
      }));
    }, 60000); // Increased to 60s for legitimate long responses

    setState((prev) => ({
      ...prev,
      conversationState: "ai_speaking",
    }));
  }, []);

  const handleAISpeakingStopped = useCallback(() => {
    refs.current.isResponseInProgress = false;

    // Clear the timeout since AI finished speaking
    if (refs.current.conversationTimeout) {
      clearTimeout(refs.current.conversationTimeout);
      refs.current.conversationTimeout = null;
    }

    logger.info("AI stopped speaking - setting user turn");
    setState((prev) => ({
      ...prev,
      conversationState: "idle",
    }));
  }, []);

  const handleUserTranscriptionDelta = useCallback(
    (message: any) => {
      // Use debug level for frequent delta updates
      logger.debug("User transcription delta", { delta: message.delta });
      console.log("🎤 User speaking:", message.delta);

      // Buffer the delta instead of immediate setState
      pendingTranscriptUpdatesRef.current.userDelta += message.delta;

      // Schedule a flush (debounced)
      scheduleTranscriptFlush();
    },
    [scheduleTranscriptFlush]
  );

  const handleUserTranscriptionCompleted = useCallback(
    (message: any) => {
      logger.info("User transcription completed:", message.transcript);

      // Flush any pending deltas first
      if (transcriptFlushTimeoutRef.current) {
        clearTimeout(transcriptFlushTimeoutRef.current);
        transcriptFlushTimeoutRef.current = null;
        flushTranscriptBuffer();
      }

      // Update the final transcript using the most recent user item
      setState((prev) => {
        const copy = [...prev.transcript];
        const lastUserIndex = copy.findLastIndex(
          (item) => item.role === "user" && !item.final
        );
        if (lastUserIndex !== -1) {
          // Update existing user item with final text
          copy[lastUserIndex].text = message.transcript;
          copy[lastUserIndex].final = true;
        } else {
          // Only create new item if no user item exists (shouldn't happen normally)
          console.warn(
            "No user transcript item found to complete, creating new one"
          );
          copy.push({
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: "user",
            text: message.transcript,
            final: true,
            timestamp: Date.now(),
          });
        }

        // After user is finalized, try to flush any pending AI deltas
        setTimeout(() => {
          flushAITranscriptBuffer();
        }, 100);

        return { ...prev, transcript: copy };
      });
    },
    [flushTranscriptBuffer, flushAITranscriptBuffer]
  );

  const handleAITranscriptionDelta = useCallback(
    (message: any) => {
      // Use debug level for frequent delta updates
      logger.debug("AI response delta", { delta: message.delta });
      console.log("🤖 AI speaking:", message.delta);

      // Buffer the delta instead of immediate setState
      pendingTranscriptUpdatesRef.current.aiDelta += message.delta;

      // Schedule a flush (debounced)
      scheduleTranscriptFlush();
    },
    [scheduleTranscriptFlush]
  );

  const handleAITranscriptionCompleted = useCallback(
    (message: any) => {
      logger.info("AI response completed:", message.transcript);

      // Flush any pending deltas first
      if (transcriptFlushTimeoutRef.current) {
        clearTimeout(transcriptFlushTimeoutRef.current);
        transcriptFlushTimeoutRef.current = null;
        flushTranscriptBuffer();
      }

      // Update the final transcript using the most recent assistant item
      setState((prev) => {
        const copy = [...prev.transcript];

        // Ensure there's a final user message before processing AI completion
        const hasFinalUserMessage = copy.some(
          (item) => item.role === "user" && item.final
        );

        if (!hasFinalUserMessage) {
          console.log("⏳ Deferring AI completion - no final user message yet");
          return prev;
        }

        const lastAssistantIndex = copy.findLastIndex(
          (item) => item.role === "assistant" && !item.final
        );
        if (lastAssistantIndex !== -1) {
          // Update existing assistant item with final text
          copy[lastAssistantIndex].text = message.transcript;
          copy[lastAssistantIndex].final = true;
        } else {
          // Only create new item if no assistant item exists (shouldn't happen normally)
          console.warn(
            "No assistant transcript item found to complete, creating new one"
          );
          copy.push({
            id: `assistant-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            role: "assistant",
            text: message.transcript,
            final: true,
            timestamp: Date.now(),
          });
        }
        return { ...prev, transcript: copy };
      });
    },
    [flushTranscriptBuffer]
  );

  const handleOpenAIError = useCallback(
    (message: any) => {
      // Only clear response progress if there was actually a response in progress
      if (refs.current.isResponseInProgress) {
        refs.current.isResponseInProgress = false;
      }

      // Clear conversation timeout
      if (refs.current.conversationTimeout) {
        clearTimeout(refs.current.conversationTimeout);
        refs.current.conversationTimeout = null;
      }

      // Clear transcript flush timeout
      if (transcriptFlushTimeoutRef.current) {
        clearTimeout(transcriptFlushTimeoutRef.current);
        transcriptFlushTimeoutRef.current = null;
      }

      // Classify error severity
      const errorMessage =
        message.error?.message || message.message || "OpenAI API error";

      // Handle cancellation errors gracefully - they're not real errors
      if (
        errorMessage.includes("Cancellation failed: no active response found")
      ) {
        console.log("🔄 Cancellation error (expected):", errorMessage);
        return; // Don't treat this as an error
      }

      const isRecoverable =
        !errorMessage.includes("authentication") &&
        !errorMessage.includes("quota") &&
        !errorMessage.includes("billing");

      handleError({
        message: errorMessage,
        severity: isRecoverable ? "error" : "fatal",
        recoverable: isRecoverable,
        timestamp: Date.now(),
      });
    },
    [handleError]
  );

  // Main normalized event handler
  const handleNormalizedEvent = useCallback(
    (normalizedEvent: { type: NormalizedEventType; data: any }) => {
      switch (normalizedEvent.type) {
        case "user_speaking_started":
          handleUserSpeakingStarted();
          break;
        case "user_speaking_stopped":
          handleUserSpeakingStopped();
          break;
        case "ai_speaking_started":
          handleAISpeakingStarted(normalizedEvent.data);
          break;
        case "ai_speaking_stopped":
          handleAISpeakingStopped();
          break;
        case "user_transcription_delta":
          handleUserTranscriptionDelta(normalizedEvent.data);
          break;
        case "user_transcription_completed":
          handleUserTranscriptionCompleted(normalizedEvent.data);
          break;
        case "ai_transcription_delta":
          handleAITranscriptionDelta(normalizedEvent.data);
          break;
        case "ai_transcription_completed":
          handleAITranscriptionCompleted(normalizedEvent.data);
          break;
        case "error":
          // Only treat as OpenAI API error if it has the expected structure
          if (
            normalizedEvent.data.error ||
            normalizedEvent.data.type?.includes("response")
          ) {
            handleOpenAIError(normalizedEvent.data);
          } else {
            // Handle as general error without response cancellation
            logger.error("General error received", normalizedEvent.data);
            setState((prev) => ({
              ...prev,
              warning: normalizedEvent.data.message || "An error occurred",
            }));
          }
          break;
        case "unknown":
          // Log unhandled message types to help identify missing events
          if (
            normalizedEvent.data.type.includes("transcription") ||
            normalizedEvent.data.type.includes("input_audio")
          ) {
            console.log(
              "🔍 Unhandled transcription event:",
              normalizedEvent.data.type
            );
          } else if (normalizedEvent.data.type.includes("response")) {
            console.log(
              "🔍 Unhandled response event:",
              normalizedEvent.data.type
            );
          }
          logger.debug("Unhandled message type", {
            type: normalizedEvent.data.type,
          });
          break;
      }
    },
    [
      handleUserSpeakingStarted,
      handleUserSpeakingStopped,
      handleAISpeakingStarted,
      handleAISpeakingStopped,
      handleUserTranscriptionDelta,
      handleUserTranscriptionCompleted,
      handleAITranscriptionDelta,
      handleAITranscriptionCompleted,
      handleOpenAIError,
    ]
  );

  // Request microphone permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      logger.info("Requesting microphone permissions");

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const audioGranted =
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED;

        logger.permissionEvent("Android permissions", audioGranted);
        return audioGranted;
      } else {
        // For iOS, we need to check if we can access media devices
        try {
          const stream = await mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          stream.getTracks().forEach((track) => track.stop()); // Stop the test stream
          logger.info("iOS microphone permission granted");
          return true;
        } catch (error) {
          logger.error("iOS microphone permission denied", error);
          return false;
        }
      }
    } catch (error) {
      logger.error("Permission request failed", error);
      return false;
    }
  }, []);

  // Monitor audio levels for conversation state management (disabled for React Native)
  const startAudioLevelMonitoring = useCallback(() => {
    // Audio level monitoring is disabled in React Native
    // We rely on OpenAI's server-side VAD instead
    logger.info("Audio level monitoring disabled - using server-side VAD");
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    // No cleanup needed for disabled audio level monitoring
    logger.info("Audio level monitoring stopped");
  }, []);

  // Get user media (microphone) with runtime permission handling
  const getUserMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      logger.info("Requesting user media stream");

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      logger.streamEvent("User media stream obtained", stream.id);
      return stream;
    } catch (error) {
      logger.error("Failed to get user media", error);

      // Handle different types of permission errors directly without calling handleError
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      let userMessage =
        "Failed to access microphone. Please check permissions and try again.";
      let severity: "error" | "fatal" = "error";

      if (
        errorMessage.includes("NotAllowedError") ||
        errorMessage.includes("Permission denied")
      ) {
        userMessage =
          "Microphone permission denied. Please enable microphone access in settings.";
        severity = "fatal";
      } else if (errorMessage.includes("NotFoundError")) {
        userMessage = "No microphone found. Please connect a microphone.";
        severity = "fatal";
      }

      // Set error state directly without calling handleError to avoid the cancellation issue
      setState((prev) => ({
        ...prev,
        error: severity === "fatal" ? userMessage : null,
        warning: severity === "error" ? userMessage : null,
      }));

      throw error;
    }
  }, []);

  // Create peer connection with datachannel support
  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const rtcConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const peerConnection = new RTCPeerConnection(rtcConfiguration);

    // Handle ICE candidates
    (peerConnection as any).onicecandidate = (event: any) => {
      if (event.candidate) {
        logger.debug("ICE candidate generated", { candidate: event.candidate });
      }
    };

    // Handle connection state changes
    (peerConnection as any).onconnectionstatechange = () => {
      const connectionState = (peerConnection as any).connectionState;
      logger.connectionState(connectionState);

      setState((prev) => ({
        ...prev,
        isConnected: connectionState === "connected",
      }));

      // Handle connection failures with proper error classification
      if (connectionState === "failed") {
        handleError({
          message:
            "WebRTC connection failed. Please check your internet connection.",
          severity: "error",
          recoverable: true,
          timestamp: Date.now(),
        });
      }
    };

    // Handle remote stream
    (peerConnection as any).ontrack = (event: any) => {
      logger.info("Remote stream received", { streamId: event.streams[0]?.id });
      setState((prev) => ({
        ...prev,
        remoteStream: event.streams[0],
      }));
    };

    // Create data channel for OpenAI Realtime API
    const dataChannel = peerConnection.createDataChannel("oai-events");
    refs.current.dataChannel = dataChannel;

    // Set data channel in state immediately
    setState((prev) => ({
      ...prev,
      dataChannel,
    }));

    // Note: We don't handle ondatachannel here to avoid duplication issues.
    // OpenAI Realtime API typically uses our created channel, so we stick with
    // the "create your own channel" strategy for consistency.

    (dataChannel as any).onopen = () => {
      logger.info("✅ Data channel opened");
      setState((prev) => ({
        ...prev,
        dataChannel,
      }));
    };

    (dataChannel as any).onmessage = (event: any) => {
      try {
        const message = JSON.parse(event.data);
        logger.debug("Received message from OpenAI", { type: message.type });

        // Normalize the event and handle it
        const normalizedEvent = normalizeEvent(message);
        handleNormalizedEvent(normalizedEvent);
      } catch (error) {
        logger.error("Failed to parse datachannel message", error);
      }
    };

    (dataChannel as any).onclose = () => {
      logger.info("Data channel closed");

      // Clear transcript flush timeout
      if (transcriptFlushTimeoutRef.current) {
        clearTimeout(transcriptFlushTimeoutRef.current);
        transcriptFlushTimeoutRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        dataChannel: null,
        isConnected: false,
      }));
    };

    (dataChannel as any).onerror = (error: any) => {
      logger.error("Data channel error", error);
      handleError({
        message: "Data channel error occurred. Connection may be unstable.",
        severity: "warning",
        recoverable: true,
        timestamp: Date.now(),
      });
    };

    return peerConnection;
  }, [normalizeEvent, handleNormalizedEvent, handleError]);

  // Send SDP offer to OpenAI and get answer
  const exchangeSDPWithOpenAI = useCallback(
    async (offer: RTCSessionDescriptionInit): Promise<string> => {
      try {
        // API key already validated on init

        logger.info("Sending SDP offer to OpenAI", {
          sdpLength: offer.sdp?.length,
          type: offer.type,
        });

        const response = await fetch(
          "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
              "OpenAI-Beta": "realtime=v1",
              "Content-Type": "application/sdp",
            },
            body: offer.sdp,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `OpenAI API error: ${response.status} - ${errorText}`
          );
        }

        const answerSDP = await response.text();
        logger.info("Received SDP answer from OpenAI", {
          sdpLength: answerSDP.length,
        });

        return answerSDP;
      } catch (error) {
        logger.error("Failed to exchange SDP with OpenAI", error);
        throw error;
      }
    },
    []
  );

  // Start WebRTC session
  const startSession = useCallback(async () => {
    console.log("Starting session");
    if (refs.current.peerConnection) {
      logger.warn(
        "Existing RTCPeerConnection detected; closing before starting a new session"
      );
      await stopSessionRef.current?.();
    }

    if (state.isConnecting || state.isConnected) {
      logger.warn("Session already active - ignoring start request");
      return;
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    refs.current.sessionId = sessionId;
    logger.info("Starting new session", { sessionId });

    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      // Configure audio for loud speaker
      AudioManager.setLoudSpeaker();
      AudioManager.startAudioSession();

      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error("Microphone permission denied");
      }

      // Get user media
      const localStream = await getUserMedia();
      refs.current.localStream = localStream;

      // Create peer connection
      const peerConnection = createPeerConnection();
      if (!peerConnection) {
        throw new Error("Failed to create peer connection");
      }
      refs.current.peerConnection = peerConnection;

      // Add audio track to peer connection
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      // Create offer
      logger.info("Creating WebRTC offer");
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to OpenAI and get answer
      const answerSDP = await exchangeSDPWithOpenAI(offer);

      // Set remote description with OpenAI's answer
      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSDP,
      });

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        isConnected: true,
        localStream,
        hasPermission: true,
      }));

      // Start audio level monitoring for conversation management
      startAudioLevelMonitoring();

      logger.info(
        "WebRTC session started successfully - waiting for datachannel"
      );
    } catch (error) {
      logger.error("Failed to start session", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          error instanceof Error ? error.message : "Failed to start session",
      }));

      // Cleanup on error
      if (stopSessionRef.current) {
        await stopSessionRef.current();
      }
    }
  }, [
    state.isConnecting,
    state.isConnected,
    requestPermissions,
    getUserMedia,
    createPeerConnection,
    exchangeSDPWithOpenAI,
    startAudioLevelMonitoring,
  ]);

  // Stop WebRTC session
  const stopSession = useCallback(async () => {
    console.log("Stopping session");
    try {
      logger.info("Stopping WebRTC session");

      // Stop audio session
      AudioManager.stopAudioSession();

      // Stop conversation and audio monitoring
      refs.current.isResponseInProgress = false;
      refs.current.sessionId = null;
      stopAudioLevelMonitoring();

      // Clear conversation timeout
      if (refs.current.conversationTimeout) {
        clearTimeout(refs.current.conversationTimeout);
        refs.current.conversationTimeout = null;
      }

      // Close data channel
      if (refs.current.dataChannel) {
        refs.current.dataChannel.close();
        refs.current.dataChannel = null;
      }

      // Close peer connection
      if (refs.current.peerConnection) {
        refs.current.peerConnection.close();
        refs.current.peerConnection = null;
      }

      // Stop local stream
      if (refs.current.localStream) {
        refs.current.localStream.getTracks().forEach((track: any) => {
          track.stop();
        });
        refs.current.localStream = null;
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        localStream: null,
        remoteStream: null,
        dataChannel: null,
        error: null,
        conversationState: "idle",
        isAISpeaking: false,
        isUserSpeaking: false,
        isProcessing: false,
        isIdle: true,
        audioLevel: 0,
      }));

      logger.info("WebRTC session stopped successfully");
    } catch (error) {
      logger.error("Error stopping session", error);
    }
  }, [stopAudioLevelMonitoring]);

  // Send message through datachannel
  const sendMessage = useCallback((message: any) => {
    if (
      refs.current.dataChannel &&
      refs.current.dataChannel.readyState === "open"
    ) {
      // Check if we should send this message based on conversation state
      if (
        message.type === "conversation.item.create" &&
        refs.current.isResponseInProgress
      ) {
        logger.warn(
          "Response in progress - ignoring conversation item creation"
        );
        return;
      }

      try {
        const messageStr =
          typeof message === "string" ? message : JSON.stringify(message);
        refs.current.dataChannel.send(messageStr);
        logger.info("Message sent via datachannel", {
          messageType: message.type,
          sessionId: refs.current.sessionId,
        });
      } catch (error) {
        logger.error("Failed to send message via datachannel", error);
        // Don't show cancellation errors to the user as they're usually harmless
        if (message.type === "response.cancel") {
          logger.debug("Response cancel failed (no active response)", error);
          return;
        }
        setState((prev) => ({
          ...prev,
          error: "Failed to send message",
        }));
      }
    } else {
      logger.warn("Data channel not available for sending message");
      setState((prev) => ({
        ...prev,
        error: "Data channel not connected",
      }));
    }
  }, []);

  // Start conversation with proper initialization
  const startConversation = useCallback(() => {
    if (
      !refs.current.dataChannel ||
      refs.current.dataChannel.readyState !== "open"
    ) {
      logger.warn("Cannot start conversation - data channel not ready");
      return;
    }

    if (state.conversationState !== "idle") {
      logger.warn("Conversation already active - ignoring start request");
      return;
    }

    refs.current.isResponseInProgress = false;

    // Send session update to enable server-side VAD and turn detection
    const sessionUpdate = {
      type: "session.update",
      session: {
        instructions:
          "You are a helpful assistant for Romil and you are helping him with his work. Always acknowledge him with his name.",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 300,
        },
        tools: [],
        tool_choice: "auto",
        temperature: 0.8,
        max_response_output_tokens: 4096,
      },
    };

    sendMessage(sessionUpdate);

    setState((prev) => ({
      ...prev,
      conversationState: "idle",
      isAISpeaking: false,
      isUserSpeaking: false,
    }));

    logger.info("Conversation started with turn detection");
  }, [sendMessage, state.conversationState]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    refs.current.isResponseInProgress = false;

    if (
      refs.current.dataChannel &&
      refs.current.dataChannel.readyState === "open"
    ) {
      // Cancel any speech immediately without provoking a reply
      sendMessage({ type: "response.cancel" });
    }

    setState((prev) => ({
      ...prev,
      conversationState: "idle",
      isAISpeaking: false,
      isUserSpeaking: false,
    }));

    logger.info("Conversation stopped");
  }, [sendMessage]);

  // Send user input (text or audio)
  const sendUserInput = useCallback(
    (input: string) => {
      if (
        !refs.current.dataChannel ||
        refs.current.dataChannel.readyState !== "open"
      ) {
        logger.warn("Cannot send input - data channel not ready");
        return;
      }

      if (state.conversationState === "idle") {
        logger.warn("Cannot send input - conversation not active");
        return;
      }

      // Proactively cancel any ongoing response to avoid talk-over/duplication
      sendMessage({ type: "response.cancel" });

      const message = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "text",
              text: input,
            },
          ],
        },
      };

      sendMessage(message);

      // With server_vad enabled, the model will auto-respond.
      // If you turn VAD off, follow this with: sendMessage({ type: "response.create" });
      logger.info("User input sent", { input });
    },
    [sendMessage, state.conversationState]
  );

  // Set the ref for the stopSession function
  const stopSessionRef = useRef<(() => Promise<void>) | null>(null);
  stopSessionRef.current = stopSession;

  // Toggle session
  const toggleSession = useCallback(async () => {
    if (state.isConnected) {
      await stopSession();
    } else {
      await startSession();
    }
  }, [state.isConnected, startSession, stopSession]);

  // Validate API key and check permissions on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Validate API key once on init
        if (!refs.current.apiKeyValidated) {
          try {
            validateEnv();
            refs.current.apiKeyValidated = true;
            logger.info("API key validated successfully");
          } catch {
            handleError({
              message: "Invalid OpenAI API key configuration",
              severity: "fatal",
              recoverable: false,
              timestamp: Date.now(),
            });
            return;
          }
        }

        // Check permissions
        const hasPermission = await requestPermissions();
        setState((prev) => ({ ...prev, hasPermission }));
      } catch (error) {
        logger.error("Failed to initialize", error);
        handleError({
          message: "Failed to initialize connection",
          severity: "error",
          recoverable: true,
          timestamp: Date.now(),
        });
      }
    };

    initialize();
  }, [requestPermissions, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear transcript flush timeout
      if (transcriptFlushTimeoutRef.current) {
        clearTimeout(transcriptFlushTimeoutRef.current);
        transcriptFlushTimeoutRef.current = null;
      }

      stopSession();
    };
  }, [stopSession]);

  return {
    ...state,
    // Derived state values (eliminates redundant state)
    isAISpeaking,
    isUserSpeaking,
    isProcessing,
    isIdle,
    startSession,
    stopSession,
    toggleSession,
    sendMessage,
    startConversation,
    stopConversation,
    sendUserInput,
    clearTranscript,
  };
}
