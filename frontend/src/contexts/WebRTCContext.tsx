"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { ReactNode } from "react"
import { voiceService } from "@/services/voice"
import { toast } from "sonner"

interface WebRTCContextType {
  isConnected: boolean
  isConnecting: boolean
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  connect: (serverId: string, channelId: string) => Promise<void>
  disconnect: () => void
  toggleMute: () => void
  toggleVideo: () => void
  isMuted: boolean
  isVideoEnabled: boolean
  activeSpeakers: Set<string>
  currentChannelId: string | null
  currentServerId: string | null
  error: string | null
}

const WebRTCContext = createContext<WebRTCContextType | null>(null)

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(false)
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set())
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null)
  const [currentServerId, setCurrentServerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Set up event listeners for the voice service
  useEffect(() => {
    const handleRemoteStream = (stream: MediaStream, userId: string) => {
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev)
        newStreams.set(userId, stream)
        return newStreams
      })
    }

    const handleSpeakingStateChanged = ({ userId, isSpeaking }: { userId: string; isSpeaking: boolean }) => {
      setActiveSpeakers((prev) => {
        const newSpeakers = new Set(prev)
        if (isSpeaking) {
          newSpeakers.add(userId)
        } else {
          newSpeakers.delete(userId)
        }
        return newSpeakers
      })
    }

    const handleCallStatusChanged = (call: any) => {
      if (call.status === "active") {
        setIsConnected(true)
        setIsConnecting(false)
      } else if (call.status === "ended") {
        setIsConnected(false)
        setIsConnecting(false)
      }
    }

    voiceService.onRemoteStream(handleRemoteStream)
    voiceService.onSpeakingStateChanged(handleSpeakingStateChanged)
    voiceService.onCallStatusChanged(handleCallStatusChanged)

    return () => {
      voiceService.removeListener("remoteStream", handleRemoteStream)
      voiceService.removeListener("speakingStateChanged", handleSpeakingStateChanged)
      voiceService.removeListener("callStatusChanged", handleCallStatusChanged)
    }
  }, [])

  const connect = useCallback(
    async (serverId: string, channelId: string) => {
      if (isConnected || isConnecting) {
        console.log("Already connected or connecting")
        return
      }

      setIsConnecting(true)
      setError(null)

      try {
        console.log(`Connecting to server ${serverId}, channel ${channelId}`)

        // Use the voice service to initiate a call
        const call = await voiceService.initiateCall(channelId)

        // Set state
        setCurrentServerId(serverId)
        setCurrentChannelId(channelId)
        setIsMuted(voiceService.isMuted())

        // Get the local stream from the voice service
        const webrtcService = (voiceService as any).webrtcService
        if (webrtcService) {
          setLocalStream(webrtcService.getLocalStream())
        }

        setIsConnected(true)
        toast.success("Connected to voice channel")
      } catch (error) {
        console.error("Error connecting to voice channel:", error)
        setError("Failed to access microphone or connect to voice channel")
        toast.error("Connection failed", {
          description: "Could not access microphone or connect to voice channel",
        })

        // Clean up
        await disconnect()
      } finally {
        setIsConnecting(false)
      }
    },
    [isConnected, isConnecting],
  )

  const disconnect = useCallback(async () => {
    console.log("Disconnecting from voice channel")

    // Use the voice service to end the call
    await voiceService.endCall()

    // Reset state
    setLocalStream(null)
    setRemoteStreams(new Map())
    setIsConnected(false)
    setIsConnecting(false)
    setActiveSpeakers(new Set())
    setCurrentChannelId(null)
    setCurrentServerId(null)
    setError(null)

    toast.info("Disconnected from voice channel")
  }, [])

  const toggleMute = useCallback(() => {
    const muted = voiceService.toggleMute()
    setIsMuted(muted)
  }, [])

  const toggleVideo = useCallback(() => {
    setIsVideoEnabled((prev) => !prev)
    // In a real implementation, this would enable/disable video tracks
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      voiceService.endCall()
    }
  }, [])

  return (
    <WebRTCContext.Provider
      value={{
        isConnected,
        isConnecting,
        localStream,
        remoteStreams,
        connect,
        disconnect,
        toggleMute,
        toggleVideo,
        isMuted,
        isVideoEnabled,
        activeSpeakers,
        currentChannelId,
        currentServerId,
        error,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  )
}

export function useWebRTC() {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error("useWebRTC must be used within a WebRTCProvider")
  }
  return context
}

