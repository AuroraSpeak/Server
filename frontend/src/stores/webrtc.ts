import { defineStore } from "pinia"
import { ref } from "vue"
import { WebRTCService } from "../services/webrtc.service"
import { WebSocketService } from "../services/websocket.service"
import { VoiceService } from "../services/voice"

interface Channel {
  id: string
  name: string
}

export const useWebRTCStore = defineStore("webrtc", () => {
  const voiceService = ref<VoiceService | null>(null)
  const isCallActive = ref(false)
  const isMuted = ref(false)
  const connectionState = ref<"disconnected" | "connecting" | "connected">("disconnected")
  const error = ref<string | null>(null)
  const activeSpeakers = ref<string[]>([])
  const currentChannel = ref<string | null>(null)
  const availableChannels = ref<Channel[]>([])

  async function initialize(wsUrl: string) {
    try {
      connectionState.value = "connecting"
      const webrtcService = new WebRTCService()
      const wsService = new WebSocketService(wsUrl, webrtcService)
      webrtcService.setWebSocketService(wsService)
      voiceService.value = new VoiceService(webrtcService, wsService)
      await voiceService.value.connectToServer("server")
      connectionState.value = "connected"
      await fetchAvailableChannels()
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unbekannter Fehler"
      connectionState.value = "disconnected"
    }
  }

  async function fetchAvailableChannels() {
    try {
      const response = await fetch('/api/channels')
      if (!response.ok) throw new Error('Fehler beim Abrufen der Kanäle')
      availableChannels.value = await response.json()
    } catch (err) {
      console.error('Fehler beim Abrufen der Kanäle:', err)
    }
  }

  async function joinChannel(channelId: string) {
    try {
      if (!voiceService.value) {
        throw new Error("Voice-Service nicht initialisiert")
      }
      
      if (currentChannel.value) {
        await leaveChannel()
      }

      await voiceService.value.joinChannel(channelId)
      currentChannel.value = channelId
      isCallActive.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unbekannter Fehler"
      isCallActive.value = false
      currentChannel.value = null
    }
  }

  async function leaveChannel() {
    try {
      if (!voiceService.value) {
        throw new Error("Voice-Service nicht initialisiert")
      }
      
      if (currentChannel.value) {
        await voiceService.value.leaveChannel()
        currentChannel.value = null
        isCallActive.value = false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unbekannter Fehler"
    }
  }

  async function disconnect() {
    try {
      if (isCallActive.value) {
        await leaveChannel()
      }
      if (voiceService.value) {
        await voiceService.value.disconnectFromServer()
      }
      connectionState.value = "disconnected"
      currentChannel.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unbekannter Fehler"
    }
  }

  async function toggleMute() {
    try {
      if (!voiceService.value) {
        throw new Error("Voice-Service nicht initialisiert")
      }
      await voiceService.value.toggleMute()
      isMuted.value = voiceService.value.isMuted()
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unbekannter Fehler"
    }
  }

  return {
    connectionState,
    error,
    activeSpeakers,
    currentChannel,
    availableChannels,
    isCallActive,
    isMuted,
    initialize,
    joinChannel,
    leaveChannel,
    disconnect,
    toggleMute
  }
})

