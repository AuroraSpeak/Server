import type { WebRTCService } from "./webrtc.service"
import { WS_URL, WS_ENDPOINT } from "./api"

export class WebSocketService {
  private ws: WebSocket | null = null
  private webrtcService: WebRTCService
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: number | null = null

  constructor(webrtcService: WebRTCService) {
    this.webrtcService = webrtcService
  }

  connect() {
    // Close existing connection if any
    if (this.ws) {
      this.ws.close()
    }

    const token = localStorage.getItem("token")
    const url = new URL(`${WS_URL}${WS_ENDPOINT}`)
    
    // Füge Token als Query-Parameter hinzu
    if (token) {
      url.searchParams.append("token", token)
    }

    try {
      this.ws = new WebSocket(url.toString(), ["auraspeak-v1"])

      this.ws.onopen = () => {
        console.log("WebSocket connected")
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)

          switch (data.type) {
            case "offer":
              const answer = await this.webrtcService.createAnswer(data.offer)
              this.send({
                type: "answer",
                answer,
                targetUserId: data.userId,
              })
              break

            case "answer":
              await this.webrtcService.handleAnswer(data.answer)
              break

            case "ice-candidate":
              await this.webrtcService.handleIceCandidate(data.candidate)
              break

            case "user-joined":
              console.log("User joined:", data.userId)
              break

            case "user-left":
              console.log("User left:", data.userId)
              break

            case "error":
              console.error("WebSocket error message:", data.message)
              break

            default:
              console.warn("Unhandled message type:", data.type)
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error)
        }
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      this.ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason)

        // Attempt to reconnect if not a clean close
        if (!event.wasClean) {
          this.attemptReconnect()
        }
      }
    } catch (error) {
      console.error("Error creating WebSocket connection:", error)
      this.attemptReconnect()
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached")
      return
    }

    this.reconnectAttempts++

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000)
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect()
    }, delay)
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.error("WebSocket not open, cannot send message")
      // Versuche erneut zu verbinden, wenn die Verbindung geschlossen ist
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect()
      }
    }
  }

  initiateCall(targetUserId: string) {
    this.send({
      type: "call-request",
      targetUserId,
    })
  }

  disconnect() {
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

