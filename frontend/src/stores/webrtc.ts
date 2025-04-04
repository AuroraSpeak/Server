import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { WebRTCService } from "../services/webrtc.service"
import { WebSocketService } from "../services/websocket.service"
import { VoiceService } from "../services/voice"
import { webrtcService } from "@/services/api"

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  isCalling: boolean;
  isInCall: boolean;
  error: string | null;
  wsConnection: WebSocket | null;
}

export const useWebRTCStore = defineStore("webrtc", {
  state: (): WebRTCState => ({
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    isCalling: false,
    isInCall: false,
    error: null,
    wsConnection: null,
  }),

  actions: {
    async initialize(wsUrl: string) {
      try {
        this.wsConnection = new WebSocket(wsUrl);
        
        this.wsConnection.onopen = () => {
          console.log('WebSocket connection established');
        };

        this.wsConnection.onmessage = (event) => {
          const data = JSON.parse(event.data);
          // Handle WebSocket messages here
        };

        this.wsConnection.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.error = 'WebSocket connection error';
        };

        this.wsConnection.onclose = () => {
          console.log('WebSocket connection closed');
        };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to initialize WebSocket';
        throw error;
      }
    },

    disconnect() {
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => track.stop());
        this.remoteStream = null;
      }
    },

    async initializeLocalStream() {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to access media devices';
        console.error('Failed to access media devices:', error);
        throw error;
      }
    },

    async createPeerConnection() {
      try {
        const configuration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
          ],
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        // Add local stream to peer connection
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            this.peerConnection?.addTrack(track, this.localStream!);
          });
        }

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
          this.remoteStream = event.streams[0];
        };

        // Handle ICE candidates
        this.peerConnection.onicecandidate = async (event) => {
          if (event.candidate) {
            await webrtcService.sendIceCandidate(event.candidate);
          }
        };

        return this.peerConnection;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create peer connection';
        console.error('Failed to create peer connection:', error);
        throw error;
      }
    },

    async createOffer() {
      try {
        if (!this.peerConnection) {
          await this.createPeerConnection();
        }

        const offer = await this.peerConnection!.createOffer();
        await this.peerConnection!.setLocalDescription(offer);
        await webrtcService.sendOffer(offer);
        this.isCalling = true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create offer';
        console.error('Failed to create offer:', error);
        throw error;
      }
    },

    async handleAnswer(answer: RTCSessionDescriptionInit) {
      try {
        if (!this.peerConnection) {
          throw new Error('No peer connection established');
        }
        await this.peerConnection.setRemoteDescription(answer);
        this.isInCall = true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to handle answer';
        console.error('Failed to handle answer:', error);
        throw error;
      }
    },

    async handleOffer(offer: RTCSessionDescriptionInit) {
      try {
        if (!this.peerConnection) {
          await this.createPeerConnection();
        }

        await this.peerConnection!.setRemoteDescription(offer);
        const answer = await this.peerConnection!.createAnswer();
        await this.peerConnection!.setLocalDescription(answer);
        await webrtcService.sendAnswer(answer);
        this.isInCall = true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to handle offer';
        console.error('Failed to handle offer:', error);
        throw error;
      }
    },

    async handleIceCandidate(candidate: RTCIceCandidateInit) {
      try {
        if (!this.peerConnection) {
          throw new Error('No peer connection established');
        }
        await this.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to handle ICE candidate';
        console.error('Failed to handle ICE candidate:', error);
        throw error;
      }
    },

    endCall() {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => track.stop());
      }
      if (this.peerConnection) {
        this.peerConnection.close();
      }

      this.localStream = null;
      this.remoteStream = null;
      this.peerConnection = null;
      this.isCalling = false;
      this.isInCall = false;
    },
  },
})

