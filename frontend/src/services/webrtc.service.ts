export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null

  constructor() {
    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
    }
  }

  async startCall(targetUserId: string): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    try {
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      return offer
    } catch (error) {
      console.error("Error starting call:", error)
      throw error
    }
  }

  async handleOffer(payload: any): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      return answer
    } catch (error) {
      console.error("Error handling offer:", error)
      throw error
    }
  }

  async handleAnswer(payload: any): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp))
    } catch (error) {
      console.error("Error handling answer:", error)
      throw error
    }
  }

  async handleIceCandidate(payload: any): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload))
    } catch (error) {
      console.error("Error handling ICE candidate:", error)
      throw error
    }
  }

  async sendIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("PeerConnection not initialized")
    }

    // This would typically be sent via a signaling server
    // Implementation depends on your WebSocket service
    return Promise.resolve()
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream
    if (this.peerConnection) {
      stream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, stream)
      })
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  endCall(): void {
    if (this.peerConnection) {
      this.peerConnection.close()
      this.setupPeerConnection() // Create a new connection for future calls
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    this.remoteStream = null
  }
}

