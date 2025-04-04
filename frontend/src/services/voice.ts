import type { WebRTCService } from "./webrtc.service"
import type { WebSocketService } from "./websocket.service"

export interface CallStatus {
  isInCall: boolean
  isMicrophoneActive: boolean
  error: string | null
}

class VoiceService {
  private localStream: MediaStream | null = null
  private isMuted = false
  private callStatus: CallStatus = {
    isInCall: false,
    isMicrophoneActive: true,
    error: null,
  }

  constructor(
    private readonly webrtcService: WebRTCService,
    private readonly wsService: WebSocketService,
  ) {}

  async startCall(targetId: string): Promise<void> {
    try {
      if (!this.localStream) {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.webrtcService.setLocalStream(this.localStream)
      }

      const offer = await this.webrtcService.startCall(targetId)
      this.wsService.sendMessage({
        type: "offer",
        payload: {
          sdp: offer,
          targetUserId: targetId,
        },
      })

      this.callStatus.isInCall = true
    } catch (error) {
      this.callStatus.error = error instanceof Error ? error.message : "Unknown error"
      throw error
    }
  }

  async endCall(): Promise<void> {
    this.webrtcService.endCall()
    this.stopLocalStream()
    this.callStatus.isInCall = false
  }

  async toggleMute(): Promise<boolean> {
    if (!this.localStream) {
      throw new Error("No local stream available")
    }

    this.isMuted = !this.isMuted
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted
    })

    this.callStatus.isMicrophoneActive = !this.isMuted
    return this.isMuted
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getCallStatus(): CallStatus {
    return { ...this.callStatus }
  }

  private stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }
}

export { VoiceService }

