import { WebRTCService } from './webrtc.service';
import { WebSocketService } from './websocket.service';

export interface VoiceCall {
  id: string;
  targetUserId: string;
  status: 'connecting' | 'active' | 'ended';
  startTime: Date;
  endTime?: Date;
}

class VoiceService {
  private webrtcService: WebRTCService | null = null;
  private websocketService: WebSocketService | null = null;
  private currentCall: VoiceCall | null = null;

  async initiateCall(targetUserId: string): Promise<VoiceCall> {
    try {
      this.webrtcService = new WebRTCService();
      await this.webrtcService.initialize();

      this.websocketService = new WebSocketService(this.webrtcService);
      this.websocketService.connect();

      this.currentCall = {
        id: crypto.randomUUID(),
        targetUserId,
        status: 'connecting',
        startTime: new Date()
      };

      this.websocketService.initiateCall(targetUserId);
      return this.currentCall;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  async endCall() {
    if (this.currentCall) {
      this.currentCall.status = 'ended';
      this.currentCall.endTime = new Date();
    }

    if (this.webrtcService) {
      this.webrtcService.stopCall();
      this.webrtcService = null;
    }

    if (this.websocketService) {
      this.websocketService.disconnect();
      this.websocketService = null;
    }

    this.currentCall = null;
  }

  getCurrentCall(): VoiceCall | null {
    return this.currentCall;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.webrtcService?.on('remoteStream', callback);
  }

  onIceCandidate(callback: (candidate: RTCIceCandidateInit) => void) {
    this.webrtcService?.on('iceCandidate', callback);
  }
}

export const voiceService = new VoiceService(); 