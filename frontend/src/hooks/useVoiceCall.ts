import { useState, useCallback } from 'react';
import { voiceService } from '../services/voice';
import type { VoiceCall } from '../services/voice';

export const useVoiceCall = () => {
  const [currentCall, setCurrentCall] = useState<VoiceCall | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  const startCall = useCallback(async (targetUserId: string) => {
    try {
      const call = await voiceService.initiateCall(targetUserId);
      setCurrentCall(call);
      setIsCallActive(true);
      return call;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }, []);

  const endCall = useCallback(async () => {
    try {
      await voiceService.endCall();
      setCurrentCall(null);
      setIsCallActive(false);
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }, []);

  return {
    currentCall,
    isCallActive,
    startCall,
    endCall,
  };
}; 