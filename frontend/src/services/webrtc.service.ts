// Eigene EventEmitter-Implementierung für Browser-Kompatibilität
class BrowserEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
  }

  removeListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
}

export class WebRTCService extends BrowserEventEmitter {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStreams: Map<string, MediaStream> = new Map()
  private iceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ]

  constructor() {
    super()
  }

  async initialize() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10,
      })

      this.localStream.getTracks().forEach((track) => {
        if (this.localStream && this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream)
        }
      })

      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const userId = this.getUserIdFromSdp(this.peerConnection?.remoteDescription?.sdp || "") || "remote"
          this.remoteStreams.set(userId, event.streams[0])
          this.emit("remoteStream", event.streams[0], userId)
        }
      }

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit("iceCandidate", event.candidate)
        }
      }

      this.peerConnection.oniceconnectionstatechange = () => {
        if (this.peerConnection) {
          console.log("ICE connection state:", this.peerConnection.iceConnectionState)
          const userId = this.getUserIdFromSdp(this.peerConnection.remoteDescription?.sdp || "") || "remote"
          this.emit("connectionStateChange", this.peerConnection.iceConnectionState, userId)
        }
      }
    } catch (error) {
      console.error("Error initializing WebRTC:", error)
      throw error
    }
  }

  private getUserIdFromSdp(sdp: string): string | null {
    // In a real implementation, you would extract the user ID from the SDP
    // For now, we'll return a default value
    return "remote-user"
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: false,
    })
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    await this.peerConnection.setRemoteDescription(answer)
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    await this.peerConnection.addIceCandidate(candidate)
  }

  async createAnswer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    await this.peerConnection.setRemoteDescription(offer)
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams
  }

  stopCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    this.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop())
    })
    this.remoteStreams.clear()

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
  }
}

