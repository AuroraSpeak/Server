import type { WebRTCService } from "./webrtc.service"

interface WebSocketMessage {
  type: string
  payload: any
}

interface OfferPayload {
  sdp: RTCSessionDescriptionInit
  targetUserId: string
}

interface AnswerPayload {
  sdp: RTCSessionDescriptionInit
  targetUserId: string
}

interface IceCandidatePayload {
  candidate: RTCIceCandidateInit
  targetUserId: string
}

// Eigene EventEmitter-Implementierung für Browser-Kompatibilität
class BrowserEventEmitter {
  private listeners: { [event: string]: ((...args: unknown[]) => void)[] } = {}

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  emit(event: string, ...args: unknown[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(...args))
    }
  }

  removeListener(event: string, callback: (...args: unknown[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }
}

export class WebSocketService extends BrowserEventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private readonly reconnectDelay = 1000
  private heartbeatInterval: number | null = null
  private messageQueue: WebSocketMessage[] = []
  private readonly DEBUG = true
  private webrtcService: WebRTCService | null = null
  private token: string | null = null
  private url = ""
  private isConnecting = false
  private connectionPromise: Promise<void> | null = null

  constructor(
    private readonly wsUrl: string,
    webrtcService?: WebRTCService,
  ) {
    super()
    this.url = wsUrl.startsWith('ws') ? wsUrl : `ws://${wsUrl}`
    if (webrtcService) {
      this.webrtcService = webrtcService
    }
    // Hole den Token aus dem localStorage
    this.token = localStorage.getItem("token")
  }

  public setToken(token: string) {
    this.token = token
    localStorage.setItem("token", token)
    this.log("Token gesetzt")
  }

  private log(message: string, data?: unknown) {
    if (this.DEBUG) {
      const timestamp = new Date().toISOString()
      if (data) {
        console.log(`[${timestamp}] [WebSocketService] ${message}`, data)
      } else {
        console.log(`[${timestamp}] [WebSocketService] ${message}`)
      }
    }
  }

  private error(message: string, error?: unknown) {
    if (this.DEBUG) {
      const timestamp = new Date().toISOString()
      if (error) {
        console.error(`[${timestamp}] [WebSocketService] ${message}`, error)
      } else {
        console.error(`[${timestamp}] [WebSocketService] ${message}`)
      }
    }
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl)
        
        this.ws.onopen = () => {
          console.log("WebSocket-Verbindung hergestellt")
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          resolve()
        }

        this.ws.onclose = () => {
          console.log("WebSocket-Verbindung geschlossen")
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket-Fehler:", error)
          reject(error)
        }

        this.ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data)
            await this.handleMessage(message)
          } catch (error) {
            console.error("Fehler beim Verarbeiten der WebSocket-Nachricht:", error)
          }
        }
      } catch (error) {
        reject(error)
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

  private async handleMessage(message: WebSocketMessage): Promise<void> {
    if (!this.webrtcService) {
      throw new Error("WebRTC-Service nicht initialisiert")
    }

    if (message.type === "pong") {
      return
    }

    switch (message.type) {
      case "offer":
        await this.webrtcService.handleOffer(message.payload)
        break
      case "answer":
        await this.webrtcService.handleAnswer(message.payload)
        break
      case "ice-candidate":
        await this.webrtcService.handleIceCandidate(message.payload)
        break
      case "speaking-state":
        this.emit('speaking-state', message.payload)
        break
      default:
        console.warn("Unbekannter Nachrichtentyp:", message.type)
    }
  }

  public getUrl(): string {
    return this.url
  }

  public setWebRTCService(webrtcService: WebRTCService) {
    this.webrtcService = webrtcService
  }

  public disconnect() {
    this.log("Disconnecting from WebSocket server")
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.reconnectAttempts = 0
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Wiederverbindungsversuch ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error("Maximale Anzahl von Wiederverbindungsversuchen erreicht")
    }
  }
}

