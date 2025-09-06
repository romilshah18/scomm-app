import { useWebRTCConnection } from "./useWebRTCConnection";

/**
 * WebRTC hook for real-time audio communication with OpenAI
 */

export function useWebRTC() {
  return useWebRTCConnection();
}

// Re-export types for convenience
export type {
  WebRTCConnectionActions,
  WebRTCConnectionState,
} from "./useWebRTCConnection";
