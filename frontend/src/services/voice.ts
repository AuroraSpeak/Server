import { WebRTCService } from "./webrtc.service"
import { WebSocketService } from "./websocket.service"

// Eigene EventEmitter-Implementierung für Browser-Kompatibilität
class BrowserEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
      return true;
    }
    return false;
  }

  removeListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    return this;
  }
}

export interface VoiceCall {
  id: string
  targetUserId: string
  status: "connecting" | "active" | "ended"
  startTime: Date
  endTime?: Date
}

// Define event types for better type safety
interface VoiceServiceEvents {
  remoteStream: (stream: MediaStream, userId: string) => void
  iceCandidate: (candidate: RTCIceCandidateInit) => void
  speakingStateChanged: (data: { userId: string; isSpeaking: boolean }) => void
  callStatusChanged: (call: VoiceCall) => void
}

// Properly extend BrowserEventEmitter with typed events
class VoiceService extends BrowserEventEmitter {
  private webrtcService: WebRTCService | null = null
  private websocketService: WebSocketService | null = null
  private currentCall: VoiceCall | null = null
  private audioContext: AudioContext | null = null
  private audioAnalysers: Map<string, AnalyserNode> = new Map()
  private activeSpeakers: Set<string> = new Set()
  private speakerDetectionInterval: number | null = null

  constructor() {
    super() // Call BrowserEventEmitter constructor
  }

  async initiateCall(targetUserId: string): Promise<VoiceCall> {
    try {
      // Initialize WebRTC service
      this.webrtcService = new WebRTCService()
      await this.webrtcService.initialize()

      // Initialize WebSocket service
      this.websocketService = new WebSocketService(this.webrtcService)
      this.websocketService.connect()

      // Create a new call object
      this.currentCall = {
        id: crypto.randomUUID(),
        targetUserId,
        status: "connecting",
        startTime: new Date(),
      }

      // Set up event listeners
      this.setupEventListeners()

      // Initiate the call
      this.websocketService.initiateCall(targetUserId)

      // Set up audio analysis for local stream
      if (this.webrtcService.getLocalStream()) {
        this.setupAudioAnalysis("local", this.webrtcService.getLocalStream()!)
      }

      return this.currentCall
    } catch (error) {
      console.error("Error initiating call:", error)
      throw error
    }
  }

  private setupEventListeners() {
    if (!this.webrtcService) return

    // Listen for remote stream
    this.webrtcService.on("remoteStream", (stream: MediaStream, userId: string) => {
      // Set up audio analysis for remote stream
      this.setupAudioAnalysis(userId, stream)

      // Emit the remote stream event
      this.emit("remoteStream", stream, userId)
    })

    // Listen for connection state changes
    this.webrtcService.on("connectionStateChange", (state: string, userId: string) => {
      if (state === "connected" && this.currentCall) {
        this.currentCall.status = "active"
        this.emit("callStatusChanged", this.currentCall)
      }
    })

    // Listen for ICE candidates
    this.webrtcService.on("iceCandidate", (candidate: RTCIceCandidateInit) => {
      this.emit("iceCandidate", candidate)
    })
  }

  private setupAudioAnalysis(userId: string, stream: MediaStream) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) return

    const audioSource = this.audioContext.createMediaStreamSource(stream)
    const analyser = this.audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.5
    audioSource.connect(analyser)

    this.audioAnalysers.set(userId, analyser)

    // Start speaker detection if not already running
    if (!this.speakerDetectionInterval) {
      this.startSpeakerDetection()
    }
  }

  private startSpeakerDetection() {
    // Clear any existing interval
    if (this.speakerDetectionInterval) {
      window.clearInterval(this.speakerDetectionInterval)
    }

    // Check audio levels every 100ms
    this.speakerDetectionInterval = window.setInterval(() => {
      this.audioAnalysers.forEach((analyser, userId) => {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        // Calculate average volume
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength

        // Consider as speaking if above threshold
        const SPEAKING_THRESHOLD = 20
        const isSpeaking = average > SPEAKING_THRESHOLD

        if (isSpeaking && !this.activeSpeakers.has(userId)) {
          this.activeSpeakers.add(userId)
          this.emit("speakingStateChanged", { userId, isSpeaking: true })
        } else if (!isSpeaking && this.activeSpeakers.has(userId)) {
          this.activeSpeakers.delete(userId)
          this.emit("speakingStateChanged", { userId, isSpeaking: false })
        }
      })
    }, 100)
  }

  async endCall() {
    if (this.currentCall) {
      this.currentCall.status = "ended"
      this.currentCall.endTime = new Date()
    }

    // Stop speaker detection
    if (this.speakerDetectionInterval) {
      window.clearInterval(this.speakerDetectionInterval)
      this.speakerDetectionInterval = null
    }

    // Close audio context
    if (this.audioContext) {
      await this.audioContext.close().catch(console.error)
      this.audioContext = null
    }

    // Clear audio analysers
    this.audioAnalysers.clear()
    this.activeSpeakers.clear()

    // Stop WebRTC
    if (this.webrtcService) {
      this.webrtcService.stopCall()
      this.webrtcService = null
    }

    // Disconnect WebSocket
    if (this.websocketService) {
      this.websocketService.disconnect()
      this.websocketService = null
    }

    this.currentCall = null
  }

  getCurrentCall(): VoiceCall | null {
    return this.currentCall
  }

  toggleMute(): boolean {
    if (!this.webrtcService) return false

    const localStream = this.webrtcService.getLocalStream()
    if (!localStream) return false

    const audioTracks = localStream.getAudioTracks()
    if (audioTracks.length === 0) return false

    const track = audioTracks[0]
    track.enabled = !track.enabled

    return !track.enabled // Return true if muted
  }

  isMuted(): boolean {
    if (!this.webrtcService) return true

    const localStream = this.webrtcService.getLocalStream()
    if (!localStream) return true

    const audioTracks = localStream.getAudioTracks()
    if (audioTracks.length === 0) return true

    return !audioTracks[0].enabled
  }

  getActiveSpeakers(): Set<string> {
    return new Set(this.activeSpeakers)
  }

  onRemoteStream(callback: (stream: MediaStream, userId: string) => void) {
    this.on("remoteStream", callback)
  }

  onIceCandidate(callback: (candidate: RTCIceCandidateInit) => void) {
    this.on("iceCandidate", callback)
  }

  onSpeakingStateChanged(callback: (data: { userId: string; isSpeaking: boolean }) => void) {
    this.on("speakingStateChanged", callback)
  }

  onCallStatusChanged(callback: (call: VoiceCall) => void) {
    this.on("callStatusChanged", callback)
  }
}

export const voiceService = new VoiceService()

