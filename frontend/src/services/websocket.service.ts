import type { WebRTCService } from "./webrtc.service"

interface WebSocketMessage {
  type: string
  payload: any
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private readonly reconnectDelay = 1000
  private heartbeatInterval: number | null = null
  private messageQueue: WebSocketMessage[] = []
  private webrtcService: WebRTCService | null = null
  private token: string | null = null
  private listeners: Record<string, ((payload: any) => void)[]> = {}

  constructor(
    private readonly wsUrl: string,
    webrtcService?: WebRTCService,
  ) {
    if (webrtcService) {
      this.webrtcService = webrtcService
    }
    this.token = localStorage.getItem("token")
  }

  public setToken(token: string) {
    this.token = token
    localStorage.setItem("token", token)
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.wsUrl.startsWith("ws://") && !this.wsUrl.startsWith("wss://")) {
        reject(new Error("Invalid WebSocket URL"))
        return
      }

      // Add token to URL if available
      const wsUrlWithToken = this.token ? `${this.wsUrl}?token=${this.token}` : this.wsUrl

      this.ws = new WebSocket(wsUrlWithToken)
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"))
      }, 5000)

      this.ws.onopen = () => {
        clearTimeout(timeout)
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.processMessageQueue()
        resolve()
      }

      this.ws.onerror = (error) => {
        clearTimeout(timeout)
        console.error("WebSocket connection error:", error)
        reject(error)
      }

      this.ws.onclose = (event) => {
        this.stopHeartbeat()

        // Don't attempt to reconnect if the closure was clean
        if (event.wasClean) {
          console.log("WebSocket closed cleanly, code=" + event.code + " reason=" + event.reason)
          return
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)
          console.log(
            `WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
          )

          setTimeout(() => {
            this.reconnectAttempts++
            this.connect().catch((err) => {
              console.error("WebSocket reconnection failed:", err)
            })
          }, delay)
        } else {
          console.error("WebSocket reconnection failed after maximum attempts")
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error("Error parsing message:", error)
        }
      }
    })
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: "ping", payload: null })
      }
    }, 30000)
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  public sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      this.messageQueue.push(message)
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.type === "pong") return

    if (this.webrtcService) {
      switch (message.type) {
        case "offer":
          this.webrtcService.handleOffer(message.payload)
          break
        case "answer":
          this.webrtcService.handleAnswer(message.payload)
          break
        case "ice-candidate":
          this.webrtcService.handleIceCandidate(message.payload)
          break
      }
    }

    // Notify listeners
    if (this.listeners[message.type]) {
      this.listeners[message.type].forEach((callback) => callback(message.payload))
    }
  }

  public on(event: string, callback: (payload: any) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  public off(event: string, callback: (payload: any) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  public setWebRTCService(webrtcService: WebRTCService) {
    this.webrtcService = webrtcService
  }

  public disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = 0
  }
}

export { WebSocketService }

