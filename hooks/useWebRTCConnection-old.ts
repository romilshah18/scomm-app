import { ENV, validateEnv } from "@/config/env";
import { logger } from "@/utils/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  MediaStream,
  RTCPeerConnection,
  mediaDevices,
} from "react-native-webrtc";
import { TranscriptItem } from "./useTranscript";

export interface WebRTCConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  hasPermission: boolean | null;
  error: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  dataChannel: any | null;
  conversationState: 'idle' | 'user_speaking' | 'ai_speaking' | 'processing';
  isAISpeaking: boolean;
  isUserSpeaking: boolean;
  audioLevel: number;
  transcript: TranscriptItem[];
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
    localStream: null,
    remoteStream: null,
    dataChannel: null,
    conversationState: 'idle',
    isAISpeaking: false,
    isUserSpeaking: false,
    audioLevel: 0,
    transcript: [],
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<any | null>(null);
  const conversationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConversationActiveRef = useRef<boolean>(false);
  const isUserTurnRef = useRef<boolean>(true);
  const isAISpeakingRef = useRef<boolean>(false);
  const isResponseInProgressRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string | null>(null);

  // Transcript management function
  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: [],
    }));
  }, []);

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

  // Get user media (microphone)
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
      throw new Error("Failed to access microphone. Please check permissions.");
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
        logger.webrtcEvent("ICE candidate generated", event.candidate);
      }
    };

    // Handle connection state changes
    (peerConnection as any).onconnectionstatechange = () => {
      const connectionState = (peerConnection as any).connectionState;
      logger.connectionState(connectionState);

      setState((prev) => ({
        ...prev,
        isConnected: connectionState === "connected",
        error: connectionState === "failed" ? "WebRTC connection failed" : null,
      }));
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
    dataChannelRef.current = dataChannel;

    // Set up data channel handlers (OpenAI typically accepts our created channel)
    (dataChannel as any).onopen = () => {
      logger.info("✅ Data channel opened");
      setState((prev) => ({
        ...prev,
        dataChannel,
        isConnected: true,
      }));
    };

    (dataChannel as any).onclose = () => {
      logger.info("Data channel closed");
      setState(prev => ({
        ...prev,
        dataChannel: null,
        isConnected: false,
      }));
    };

    (dataChannel as any).onerror = (error: any) => {
      logger.error("Data channel error", error);
      setState(prev => ({
        ...prev,
        error: "Data channel error: " + (error.message || "Unknown error"),
      }));
    };

    // Handle remote data channel (backup - rarely used)
    (peerConnection as any).ondatachannel = (event: any) => {
      logger.info("Remote data channel received - using as backup");
      const remoteChannel = event.channel;
      if (remoteChannel && remoteChannel !== dataChannel) {
        dataChannelRef.current = remoteChannel;
        // Copy handlers to remote channel
        (remoteChannel as any).onopen = (dataChannel as any).onopen;
        (remoteChannel as any).onclose = (dataChannel as any).onclose;
        (remoteChannel as any).onerror = (dataChannel as any).onerror;
        (remoteChannel as any).onmessage = (dataChannel as any).onmessage;
      }
    };

    (dataChannel as any).onmessage = (event: any) => {
        try {
          const message = JSON.parse(event.data);
          logger.info("Received message from OpenAI", { type: message.type });
          console.log("OpenAI message:", message);

          // Handle different message types from OpenAI Realtime API
          switch (message.type) {
            case 'conversation.item.input_audio_buffer.speech_started':
              // User started speaking - it's their turn
              isUserTurnRef.current = true;
              isAISpeakingRef.current = false;
              logger.info("User started speaking - setting user turn", { 
                isUserTurn: isUserTurnRef.current, 
                isAISpeaking: isAISpeakingRef.current 
              });
              setState(prev => ({ 
                ...prev, 
                conversationState: 'user_speaking',
                isUserSpeaking: true,
                isAISpeaking: false
              }));
              // Stop any active TTS so the model yields to the user
              if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
                dataChannelRef.current.send(JSON.stringify({ type: "response.cancel" }));
              }
              break;

            case 'conversation.item.input_audio_buffer.speech_stopped':
              // User stopped speaking - AI's turn to process
              isUserTurnRef.current = false;
              setState(prev => ({ 
                ...prev, 
                conversationState: 'processing',
                isUserSpeaking: false 
              }));
              break;

            case 'conversation.item.output_audio_buffer.speech_started':
              // AI started speaking - it's AI's turn
              if (isResponseInProgressRef.current) {
                logger.warn("Response already in progress - ignoring duplicate speech_started");
                break;
              }
              
              isUserTurnRef.current = false;
              isAISpeakingRef.current = true;
              isResponseInProgressRef.current = true;
              logger.info("AI started speaking - setting AI turn", { 
                isUserTurn: isUserTurnRef.current, 
                isAISpeaking: isAISpeakingRef.current 
              });
              
              // Set a timeout to prevent AI from getting stuck
              if (conversationTimeoutRef.current) {
                clearTimeout(conversationTimeoutRef.current);
              }
              conversationTimeoutRef.current = setTimeout(() => {
                logger.warn("AI speaking timeout - resetting to user turn");
                isUserTurnRef.current = true;
                isAISpeakingRef.current = false;
                isResponseInProgressRef.current = false;
                setState(prev => ({ 
                  ...prev, 
                  conversationState: 'idle',
                  isAISpeaking: false
                }));
              }, 30000); // 30 second timeout
              
              setState(prev => ({ 
                ...prev, 
                conversationState: 'ai_speaking',
                isAISpeaking: true,
                isUserSpeaking: false
              }));
              break;

            case 'conversation.item.output_audio_buffer.speech_stopped':
              // AI stopped speaking - user's turn
              isUserTurnRef.current = true;
              isAISpeakingRef.current = false;
              isResponseInProgressRef.current = false;
              
              // Clear the timeout since AI finished speaking
              if (conversationTimeoutRef.current) {
                clearTimeout(conversationTimeoutRef.current);
                conversationTimeoutRef.current = null;
              }
              
              logger.info("AI stopped speaking - setting user turn", { 
                isUserTurn: isUserTurnRef.current, 
                isAISpeaking: isAISpeakingRef.current 
              });
              setState(prev => ({ 
                ...prev, 
                conversationState: 'idle',
                isAISpeaking: false 
              }));
              break;

            // --- User transcription (from Whisper) ---
            case 'conversation.item.input_audio_transcription.delta':
              logger.info("User transcription delta:", message.delta);
              setState(prev => {
                const copy = [...prev.transcript];
                if (
                  copy.length &&
                  copy[copy.length - 1].role === "user" &&
                  !copy[copy.length - 1].final
                ) {
                  copy[copy.length - 1].text += message.delta;
                } else {
                  copy.push({ 
                    role: "user", 
                    text: message.delta, 
                    final: false, 
                    timestamp: Date.now() 
                  });
                }
                return { ...prev, transcript: copy };
              });
              break;

            case 'conversation.item.input_audio_transcription.completed':
              logger.info("User transcription completed:", message.transcript);
              setState(prev => {
                const copy = [...prev.transcript];
                if (copy.length && copy[copy.length - 1].role === "user") {
                  copy[copy.length - 1].text = message.transcript;
                  copy[copy.length - 1].final = true;
                }
                return { ...prev, transcript: copy };
              });
              break;

            // --- AI responses ---
            case 'response.audio_transcript.delta':
              logger.info("AI response delta:", message.delta);
              setState(prev => {
                const copy = [...prev.transcript];
                if (
                  copy.length &&
                  copy[copy.length - 1].role === "ai" &&
                  !copy[copy.length - 1].final
                ) {
                  copy[copy.length - 1].text += message.delta;
                } else {
                  copy.push({ 
                    role: "ai", 
                    text: message.delta, 
                    final: false, 
                    timestamp: Date.now() 
                  });
                }
                return { ...prev, transcript: copy };
              });
              break;

            case 'response.audio_transcript.done':
              logger.info("AI response completed:", message.transcript);
              setState(prev => {
                const copy = [...prev.transcript];
                if (copy.length && copy[copy.length - 1].role === "ai") {
                  copy[copy.length - 1].text = message.transcript;
                  copy[copy.length - 1].final = true;
                }
                return { ...prev, transcript: copy };
              });
              break;

            case 'conversation.item.output_audio_buffer.audio_added':
              // AI is adding audio to the output buffer
              isUserTurnRef.current = false;
              isAISpeakingRef.current = true;
              logger.info("AI audio added to buffer", { 
                isUserTurn: isUserTurnRef.current, 
                isAISpeaking: isAISpeakingRef.current 
              });
              setState(prev => ({ 
                ...prev, 
                conversationState: 'ai_speaking',
                isAISpeaking: true,
                isUserSpeaking: false
              }));
              break;

            case 'conversation.item.output_audio_buffer.done':
              // AI has finished speaking - user's turn
              isUserTurnRef.current = true;
              isAISpeakingRef.current = false;
              isResponseInProgressRef.current = false;
              
              // Clear the timeout since AI finished speaking
              if (conversationTimeoutRef.current) {
                clearTimeout(conversationTimeoutRef.current);
                conversationTimeoutRef.current = null;
              }
              
              logger.info("AI audio buffer done - user's turn", { 
                isUserTurn: isUserTurnRef.current, 
                isAISpeaking: isAISpeakingRef.current 
              });
              setState(prev => ({ 
                ...prev, 
                conversationState: 'idle',
                isAISpeaking: false 
              }));
              break;

            case 'conversation.item.output_audio_buffer.committed':
              // AI audio has been committed to the output
              logger.info("AI audio committed to output");
              break;

            case 'response.audio.delta':
              // AI is streaming audio response
              logger.debug("AI audio delta received", { 
                audioDataLength: message.audio_data?.length || 0 
              });
              break;

            case 'response.audio.done':
              // AI audio response completed
              logger.info("AI audio response completed");
              isUserTurnRef.current = true;
              isAISpeakingRef.current = false;
              isResponseInProgressRef.current = false;
              
              // Clear timeout
              if (conversationTimeoutRef.current) {
                clearTimeout(conversationTimeoutRef.current);
                conversationTimeoutRef.current = null;
              }
              
              setState(prev => ({ 
                ...prev, 
                conversationState: 'idle',
                isAISpeaking: false 
              }));
              break;

            case 'response.text.delta':
              // AI is streaming text response
              logger.debug("AI text delta received", { 
                text: message.text 
              });
              break;

            case 'response.text.done':
              // AI text response completed
              logger.info("AI text response completed");
              break;

            case 'response.done':
              // AI response completely finished
              logger.info("AI response completely finished");
              isUserTurnRef.current = true;
              isAISpeakingRef.current = false;
              isResponseInProgressRef.current = false;
              
              // Clear timeout
              if (conversationTimeoutRef.current) {
                clearTimeout(conversationTimeoutRef.current);
                conversationTimeoutRef.current = null;
              }
              
              setState(prev => ({ 
                ...prev, 
                conversationState: 'idle',
                isAISpeaking: false 
              }));
              break;

            case 'response.cancelled':
              // AI response was cancelled
              logger.info("AI response cancelled");
              isUserTurnRef.current = true;
              isAISpeakingRef.current = false;
              isResponseInProgressRef.current = false;
              
              // Clear timeout
              if (conversationTimeoutRef.current) {
                clearTimeout(conversationTimeoutRef.current);
                conversationTimeoutRef.current = null;
              }
              
              setState(prev => ({ 
                ...prev, 
                conversationState: 'idle',
                isAISpeaking: false 
              }));
              break;

            case 'error':
              logger.error("OpenAI API error", message.error);
              isUserTurnRef.current = true;
              isAISpeakingRef.current = false;
              isResponseInProgressRef.current = false;
              
              // Clear timeout
              if (conversationTimeoutRef.current) {
                clearTimeout(conversationTimeoutRef.current);
                conversationTimeoutRef.current = null;
              }
              
              setState(prev => ({ 
                ...prev, 
                error: message.error?.message || "OpenAI API error",
                conversationState: 'idle',
                isAISpeaking: false,
                isUserSpeaking: false
              }));
              break;

            default:
              logger.debug("Unhandled message type", { type: message.type });
          }
        } catch (error) {
          logger.error("Failed to parse datachannel message", error);
        }
      };

    (dataChannel as any).onclose = () => {
      logger.info("Data channel closed");
      setState((prev) => ({
        ...prev,
        dataChannel: null,
        isConnected: false,
      }));
    };

    (dataChannel as any).onerror = (error: any) => {
      logger.error("Data channel error", error);
      setState((prev) => ({
        ...prev,
        error: "Data channel error occurred",
      }));
    };

    return peerConnection;
  }, []);

  // Send SDP offer to OpenAI and get answer
  const exchangeSDPWithOpenAI = useCallback(
    async (offer: RTCSessionDescriptionInit): Promise<string> => {
      try {
        validateEnv();

        // Check if API key is properly set
        if (ENV.OPENAI_API_KEY === "your_openai_api_key_here") {
          throw new Error(
            "Please set your OpenAI API key in the environment variables"
          );
        }

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
    if (peerConnectionRef.current) {
      logger.warn("Existing RTCPeerConnection detected; closing before starting a new session");
      await stopSessionRef.current?.();
    }
    
    if (state.isConnecting || state.isConnected) {
      logger.warn("Session already active - ignoring start request");
      return;
    }

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionIdRef.current = sessionId;
    logger.info("Starting new session", { sessionId });

    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error("Microphone permission denied");
      }

      // Get user media
      const localStream = await getUserMedia();
      localStreamRef.current = localStream;

      // Create peer connection
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;

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
    try {
      logger.info("Stopping WebRTC session");

      // Stop conversation and audio monitoring
      isConversationActiveRef.current = false;
      isUserTurnRef.current = true;
      isAISpeakingRef.current = false;
      isResponseInProgressRef.current = false;
      sessionIdRef.current = null;
      stopAudioLevelMonitoring();

      // Clear conversation timeout
      if (conversationTimeoutRef.current) {
        clearTimeout(conversationTimeoutRef.current);
        conversationTimeoutRef.current = null;
      }

      // Close data channel
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        localStreamRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        localStream: null,
        remoteStream: null,
        dataChannel: null,
        error: null,
        conversationState: 'idle',
        isAISpeaking: false,
        isUserSpeaking: false,
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
      dataChannelRef.current &&
      dataChannelRef.current.readyState === "open"
    ) {
      // Check if we should send this message based on conversation state
      if (message.type === "conversation.item.create" && isResponseInProgressRef.current) {
        logger.warn("Response in progress - ignoring conversation item creation");
        return;
      }
      
      try {
        const messageStr =
          typeof message === "string" ? message : JSON.stringify(message);
        dataChannelRef.current.send(messageStr);
        logger.info("Message sent via datachannel", { 
          messageType: message.type,
          sessionId: sessionIdRef.current 
        });
      } catch (error) {
        logger.error("Failed to send message via datachannel", error);
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
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      logger.warn("Cannot start conversation - data channel not ready");
      return;
    }

    if (isConversationActiveRef.current) {
      logger.warn("Conversation already active - ignoring start request");
      return;
    }

    isConversationActiveRef.current = true;
    isUserTurnRef.current = true;
    isAISpeakingRef.current = false;
    isResponseInProgressRef.current = false;
    
    // Send session update to enable server-side VAD and turn detection
    const sessionUpdate = {
      type: "session.update",
      session: {
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 300
        },
        tools: [],
        tool_choice: "auto",
        temperature: 0.8,
        max_response_output_tokens: 4096
      }
    };

    sendMessage(sessionUpdate);
    
    setState(prev => ({ 
      ...prev, 
      conversationState: 'idle',
      isAISpeaking: false,
      isUserSpeaking: false
    }));

    logger.info("Conversation started with turn detection");
  }, [sendMessage]);

  // Stop conversation
  const stopConversation = useCallback(() => {
    isConversationActiveRef.current = false;
    isUserTurnRef.current = true;
    isAISpeakingRef.current = false;
    isResponseInProgressRef.current = false;
    
    if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
      // Cancel any speech immediately without provoking a reply
      sendMessage({ type: "response.cancel" });
    }

    setState(prev => ({ 
      ...prev, 
      conversationState: 'idle',
      isAISpeaking: false,
      isUserSpeaking: false
    }));

    logger.info("Conversation stopped");
  }, [sendMessage]);

  // Send user input (text or audio)
  const sendUserInput = useCallback((input: string) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== "open") {
      logger.warn("Cannot send input - data channel not ready");
      return;
    }

    if (!isConversationActiveRef.current) {
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
  }, [sendMessage]);

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

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const hasPermission = await requestPermissions();
        setState((prev) => ({ ...prev, hasPermission }));
      } catch (error) {
        logger.error("Failed to check permissions", error);
        setState((prev) => ({
          ...prev,
          hasPermission: false,
          error: "Failed to check permissions",
        }));
      }
    };

    checkPermissions();
  }, [requestPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    ...state,
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
