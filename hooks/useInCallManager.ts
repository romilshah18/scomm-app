import InCallManager from 'react-native-incall-manager';

// Simple utility functions for audio routing
export const AudioManager = {
  setLoudSpeaker: () => {
    try {
      InCallManager.setForceSpeakerphoneOn(true);
    } catch (error) {
      console.error('Error setting loud speaker:', error);
    }
  },

  startAudioSession: () => {
    try {
      InCallManager.start({ media: 'audio' });
    } catch (error) {
      console.error('Error starting audio session:', error);
    }
  },

  stopAudioSession: () => {
    try {
      InCallManager.stop();
    } catch (error) {
      console.error('Error stopping audio session:', error);
    }
  }
};