"use client"

import { useState, useCallback, useEffect } from "react"
import { voiceService } from "../services/voice"
import type { VoiceCall } from "../services/voice"

export const useVoiceCall = () => {
  const [currentCall, setCurrentCall] = useState<VoiceCall | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set())
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())

  useEffect(() => {
    // Set up event listeners
    const handleCallStatusChanged = (call: VoiceCall) => {
      setCurrentCall(call)
      setIsCallActive(call.status === "active")
    }

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

    voiceService.onCallStatusChanged(handleCallStatusChanged)
    voiceService.onRemoteStream(handleRemoteStream)
    voiceService.onSpeakingStateChanged(handleSpeakingStateChanged)

    // Clean up event listeners
    return () => {
      voiceService.removeListener("callStatusChanged", handleCallStatusChanged)
      voiceService.removeListener("remoteStream", handleRemoteStream)
      voiceService.removeListener("speakingStateChanged", handleSpeakingStateChanged)
    }
  }, [])

  const startCall = useCallback(async (targetUserId: string) => {
    try {
      const call = await voiceService.initiateCall(targetUserId)
      setCurrentCall(call)
      setIsCallActive(true)
      setIsMuted(voiceService.isMuted())
      return call
    } catch (error) {
      console.error("Error starting call:", error)
      throw error
    }
  }, [])

  const endCall = useCallback(async () => {
    try {
      await voiceService.endCall()
      setCurrentCall(null)
      setIsCallActive(false)
      setRemoteStreams(new Map())
      setActiveSpeakers(new Set())
    } catch (error) {
      console.error("Error ending call:", error)
      throw error
    }
  }, [])

  const toggleMute = useCallback(() => {
    const muted = voiceService.toggleMute()
    setIsMuted(muted)
    return muted
  }, [])

  return {
    currentCall,
    isCallActive,
    isMuted,
    activeSpeakers,
    remoteStreams,
    startCall,
    endCall,
    toggleMute,
  }
}

