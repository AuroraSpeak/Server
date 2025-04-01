import React, { useEffect, useRef, useState } from 'react';
import { voiceService } from '../services/voice';
import type { VoiceCall as VoiceCallType } from '../services/voice';

interface VoiceCallProps {
  targetUserId: string;
  onCallEnd: () => void;
}

export const VoiceCall: React.FC<VoiceCallProps> = ({ targetUserId, onCallEnd }) => {
  const [call, setCall] = useState<VoiceCallType | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        const newCall = await voiceService.initiateCall(targetUserId);
        setCall(newCall);

        voiceService.onRemoteStream((stream: MediaStream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
          }
        });

        voiceService.onIceCandidate((candidate: RTCIceCandidateInit) => {
          // Ice candidates werden automatisch vom WebSocketService gehandhabt
        });
      } catch (error) {
        console.error('Error initializing call:', error);
      }
    };

    initializeCall();

    return () => {
      voiceService.endCall();
    };
  }, [targetUserId]);

  const handleEndCall = async () => {
    await voiceService.endCall();
    onCallEnd();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-lg font-semibold">
          {call?.status === 'active' ? 'Anruf läuft...' : 'Verbindung wird hergestellt...'}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleEndCall}
            className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors"
          >
            Anruf beenden
          </button>
        </div>

        <audio ref={localAudioRef} autoPlay muted />
        <audio ref={remoteAudioRef} autoPlay />
      </div>
    </div>
  );
}; 