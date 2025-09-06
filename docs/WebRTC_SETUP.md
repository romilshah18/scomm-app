# WebRTC + OpenAI Realtime API Setup Guide

This guide will help you set up the WebRTC integration with OpenAI's Realtime API in your React Native app.

## Prerequisites

1. **OpenAI API Key**: You need a valid OpenAI API key with access to the Realtime API
2. **React Native Environment**: Expo custom dev client or React Native CLI
3. **Device Permissions**: Microphone access is required

## Installation

The following dependencies have been installed:

```bash
npm install react-native-webrtc
npm install react-native-dotenv
```

## Configuration

### 1. Environment Variables

Create a `.env` file in your project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_REALTIME_API_URL=wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01
```

### 2. Platform Configuration

#### iOS (app.json)

```json
{
  "ios": {
    "infoPlist": {
      "NSMicrophoneUsageDescription": "This app needs access to microphone for WebRTC audio communication.",
      "NSCameraUsageDescription": "This app needs access to camera for WebRTC video communication."
    }
  }
}
```

#### Android (app.json)

```json
{
  "android": {
    "permissions": [
      "android.permission.RECORD_AUDIO",
      "android.permission.CAMERA",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE"
    ]
  }
}
```

## Usage

### Basic Implementation

```typescript
import { useWebRTCConnection } from "@/hooks/useWebRTCConnection";

function MyComponent() {
  const {
    isConnected,
    isConnecting,
    hasPermission,
    error,
    localStream,
    remoteStream,
    startSession,
    stopSession,
    toggleSession,
  } = useWebRTCConnection();

  return (
    <View>
      <Button
        title={isConnected ? "Stop" : "Start"}
        onPress={toggleSession}
        disabled={!hasPermission || isConnecting}
      />
      {error && <Text>Error: {error}</Text>}
    </View>
  );
}
```

### Features

- **Real-time Audio Communication**: Bidirectional audio with OpenAI's Realtime API
- **Automatic Permission Handling**: Requests microphone permissions automatically
- **Connection State Management**: Tracks connection status and errors
- **Stream Management**: Handles local and remote audio streams
- **Error Handling**: Comprehensive error handling and logging
- **Production Ready**: TypeScript, proper logging, and clean architecture

## Architecture

### Components

1. **useWebRTCConnection Hook**: Main hook managing WebRTC connection
2. **WebRTCMicScreen**: UI component for testing the connection
3. **Logger**: Production-ready logging utility
4. **Environment Config**: Centralized environment variable management

### Flow

1. **Permission Request**: App requests microphone permissions
2. **Media Stream**: Gets user's microphone stream
3. **Peer Connection**: Creates WebRTC peer connection
4. **OpenAI Connection**: Establishes WebSocket connection to OpenAI
5. **Offer/Answer**: Exchanges WebRTC offer/answer with OpenAI
6. **Audio Communication**: Real-time bidirectional audio communication

## Testing

1. **Set your OpenAI API key** in the environment variables
2. **Run the app** on a physical device (WebRTC doesn't work in simulators)
3. **Navigate to the WebRTC tab** in the app
4. **Tap the Start button** to begin the session
5. **Speak into the microphone** to communicate with the AI
6. **Listen for AI responses** through the device speakers

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure microphone permissions are granted
2. **Connection Failed**: Check your OpenAI API key and internet connection
3. **No Audio**: Verify device volume and audio settings
4. **Simulator Issues**: WebRTC requires a physical device

### Debugging

The app includes comprehensive logging. Check the console for:

- Permission events
- WebRTC connection states
- OpenAI API messages
- Stream events
- Error details

## Production Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Error Handling**: Implement proper error boundaries
3. **Network Conditions**: Handle poor network connectivity
4. **Battery Optimization**: Consider battery usage for long sessions
5. **Audio Quality**: Monitor and adjust audio settings as needed

## Next Steps

- Implement custom UI for your specific use case
- Add video support if needed
- Implement custom audio processing
- Add connection quality monitoring
- Implement reconnection logic for network issues
