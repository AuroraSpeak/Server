import { WebRTCService } from "./webrtc.service"
import { WebSocketService } from "./websocket.service"

export interface SpeakingState {
  userId: string
  isSpeaking: boolean
}

export interface CallStatus {
  isInCall: boolean
  channelId: string | null
  participants: string[]
}

export class VoiceService {
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private isConnected = false
  private speakingStateCallback: ((state: SpeakingState) => void) | null = null
  private currentChannel: string | null = null

  constructor(
    private webrtcService: WebRTCService,
    private wsService: WebSocketService
  ) {
    this.wsService.on('speaking-state', (state: unknown) => {
      if (this.isSpeakingState(state)) {
        this.notifySpeakingState(state)
      }
    })
  }

  private isSpeakingState(state: unknown): state is SpeakingState {
    return (
      typeof state === 'object' &&
      state !== null &&
      'userId' in state &&
      'isSpeaking' in state &&
      typeof (state as SpeakingState).userId === 'string' &&
      typeof (state as SpeakingState).isSpeaking === 'boolean'
    )
  }

  private notifySpeakingState(state: SpeakingState): void {
    if (this.speakingStateCallback) {
      this.speakingStateCallback(state)
    }
  }

  async connectToServer(serverId: string) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      await this.webrtcService.createPeerConnection(serverId)
      this.isConnected = true
    } catch (err) {
      console.error("Fehler beim Verbinden mit dem Server:", err)
      throw err
    }
  }

  async joinChannel(channelId: string) {
    try {
      if (!this.isConnected) {
        throw new Error("Nicht mit dem Server verbunden")
      }

      this.currentChannel = channelId
      this.wsService.sendMessage({
        type: "join-channel",
        payload: { channelId }
      })
    } catch (err) {
      console.error("Fehler beim Beitreten des Kanals:", err)
      throw err
    }
  }

  async leaveChannel() {
    try {
      if (this.currentChannel) {
        this.wsService.sendMessage({
          type: "leave-channel",
          payload: { channelId: this.currentChannel }
        })
        this.currentChannel = null
      }
    } catch (err) {
      console.error("Fehler beim Verlassen des Kanals:", err)
      throw err
    }
  }

  async disconnectFromServer() {
    try {
      if (this.currentChannel) {
        await this.leaveChannel()
      }
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop())
        this.localStream = null
      }
      this.isConnected = false
    } catch (err) {
      console.error("Fehler beim Trennen der Verbindung:", err)
      throw err
    }
  }

  async startCall(serverId: string): Promise<void> {
    try {
      if (!this.localStream) {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.webrtcService.setLocalStream(this.localStream)
      }
      await this.webrtcService.createPeerConnection(serverId)
    } catch (error) {
      console.error("Fehler beim Starten des Anrufs:", error)
      throw error
    }
  }

  async endCall(): Promise<void> {
    try {
      await this.webrtcService.endCall()
      this.stopLocalStream()
      this.stopRemoteStream()
    } catch (error) {
      console.error("Fehler beim Beenden des Anrufs:", error)
      throw error
    }
  }

  async toggleMute(): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        this.notifySpeakingState({
          userId: 'local',
          isSpeaking: !audioTrack.enabled
        })
      }
    }
  }

  isMuted(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      return audioTrack ? !audioTrack.enabled : false
    }
    return false
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStreams(): MediaStream[] {
    return this.remoteStream ? [this.remoteStream] : []
  }

  setSpeakingStateCallback(callback: (state: SpeakingState) => void) {
    this.speakingStateCallback = callback
  }

  getCallStatus(): CallStatus {
    return {
      isInCall: !!this.currentChannel,
      channelId: this.currentChannel,
      participants: [] // Wird vom Server verwaltet
    }
  }

  private stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }

  private stopRemoteStream() {
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop())
      this.remoteStream = null
    }
  }
}

