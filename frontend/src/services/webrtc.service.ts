import type { WebSocketService } from "./websocket.service"

export class WebRTCService {
  private wsService: WebSocketService | null = null
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null

  constructor(wsService?: WebSocketService) {
    if (wsService) {
      this.wsService = wsService
    }
  }

  setWebSocketService(service: WebSocketService) {
    this.wsService = service
  }

  async createPeerConnection(serverId: string) {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      })

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.wsService) {
          this.wsService.sendMessage({
            type: "ice-candidate",
            payload: {
              candidate: event.candidate,
              targetUserId: serverId
            }
          })
        }
      }

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
      }

      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      if (this.wsService) {
        this.wsService.sendMessage({
          type: "offer",
          payload: {
            sdp: offer,
            targetUserId: serverId
          }
        })
      }
    } catch (err) {
      console.error("Fehler beim Erstellen der Peer-Verbindung:", err)
      throw err
    }
  }

  async handleOffer(payload: { sdp: RTCSessionDescriptionInit, targetUserId: string }) {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection(payload.targetUserId)
      }

      await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      const answer = await this.peerConnection?.createAnswer()
      await this.peerConnection?.setLocalDescription(answer)

      if (this.wsService) {
        this.wsService.sendMessage({
          type: "answer",
          payload: {
            sdp: answer,
            targetUserId: payload.targetUserId
          }
        })
      }
    } catch (err) {
      console.error("Fehler beim Verarbeiten des Angebots:", err)
      throw err
    }
  }

  async handleAnswer(payload: { sdp: RTCSessionDescriptionInit, targetUserId: string }) {
    try {
      await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(payload.sdp))
    } catch (err) {
      console.error("Fehler beim Verarbeiten der Antwort:", err)
      throw err
    }
  }

  async handleIceCandidate(payload: { candidate: RTCIceCandidateInit, targetUserId: string }) {
    try {
      await this.peerConnection?.addIceCandidate(new RTCIceCandidate(payload.candidate))
    } catch (err) {
      console.error("Fehler beim Verarbeiten des ICE-Kandidaten:", err)
      throw err
    }
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream
    stream.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, stream)
    })
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStreams(): MediaStream[] {
    return this.remoteStream ? [this.remoteStream] : []
  }

  async endCall() {
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    this.remoteStream = null
  }
}


