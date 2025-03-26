"use client"

import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import type { User } from "@/contexts/app-context"
import { getSocket } from "@/lib/socket"
import type { Socket } from "socket.io-client"

// TYPES

type PeerConnection = {
  userId: string
  connection: RTCPeerConnection
  audioStream?: MediaStream
  audioTrack?: MediaStreamTrack
}

type WebRTCContextType = {
  localStream: MediaStream | null
  peerConnections: Map<string, PeerConnection>
  isMicrophoneActive: boolean
  isSpeaking: boolean
  activeSpeakers: Set<string>
  logs: string[]
  userPings: Map<string, number>
  joinVoiceChannel: (channelId: string, participants: User[]) => Promise<void>
  leaveVoiceChannel: () => void
  toggleMicrophone: () => void
  getAudioLevel: (userId: string) => number
  muteStatus: Map<string, boolean>
  voiceChannelUsers: Map<string, Set<string>>
}

const WebRTCContext = createContext<WebRTCContextType | null>(null)

export const useWebRTC = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error("useWebRTC must be used within a WebRTCProvider")
  }
  return context
}

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map())
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set())
  const [logs, setLogs] = useState<string[]>([])
  const [userPings, setUserPings] = useState<Map<string, number>>(new Map())
  const [muteStatus, setMuteStatus] = useState<Map<string, boolean>>(new Map())
  const [voiceChannelUsers, setVoiceChannelUsers] = useState<Map<string, Set<string>>>(new Map())

  const socket = useRef<Socket | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map())
  const audioLevelsRef = useRef<Map<string, number>>(new Map())
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioAnalyserRef = useRef<AnalyserNode | null>(null)

  const log = (msg: string) => {
    setLogs((prev) => [...prev.slice(-99), msg])
  }

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => {
      audioContextRef.current?.close()
    }
  }, [])

  useEffect(() => {
    fetch("/api/socket")
  }, [])

  useEffect(() => {
    return () => {
      leaveVoiceChannel()
    }
  }, [])

  const getUserMedia = async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

    if (audioContextRef.current) {
      const source = audioContextRef.current.createMediaStreamSource(stream)
      const analyser = audioContextRef.current.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      audioAnalyserRef.current = analyser
      monitorAudioLevels()
    }

    return stream
  }

  const monitorAudioLevels = () => {
    const analyser = audioAnalyserRef.current
    if (!analyser) return
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const check = () => {
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setIsSpeaking(avg > 20)
      if (user) audioLevelsRef.current.set(user.id, avg)
      requestAnimationFrame(check)
    }
    check()
  }

  const createPeerConnection = (remoteUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfig)

    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current)
      }
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && socket.current && user) {
        log(`[ICE] Candidate for ${remoteUserId}`)
        socket.current.emit("signal", {
          to: remoteUserId,
          from: user.id,
          data: { candidate: e.candidate },
        })
      }
    }

    pc.ontrack = (e) => {
      if (e.track.kind === "audio") {
        const stream = new MediaStream([e.track])
        const audio = new Audio()
        audio.srcObject = stream
        audio.autoplay = true

        if (audioContextRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream)
          const analyser = audioContextRef.current.createAnalyser()
          analyser.fftSize = 256
          source.connect(analyser)
          const dataArray = new Uint8Array(analyser.frequencyBinCount)

          const check = () => {
            analyser.getByteFrequencyData(dataArray)
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
            audioLevelsRef.current.set(remoteUserId, avg)
            setActiveSpeakers((prev) => {
              const next = new Set(prev)
              avg > 20 ? next.add(remoteUserId) : next.delete(remoteUserId)
              return next
            })
            requestAnimationFrame(check)
          }
          check()
        }

        const existing = peerConnectionsRef.current.get(remoteUserId)
        peerConnectionsRef.current.set(remoteUserId, {
          ...existing!,
          audioStream: stream,
          audioTrack: e.track,
        })
        setPeerConnections(new Map(peerConnectionsRef.current))
      }
    }

    return pc
  }

  const handleSignaling = () => {
    socket.current?.on("signal", async ({ from, data }) => {
      log(`[SIGNAL] from ${from}: ${data.type || "candidate"}`)
      const pc =
        peerConnectionsRef.current.get(from)?.connection || createPeerConnection(from)

      if (!peerConnectionsRef.current.has(from)) {
        peerConnectionsRef.current.set(from, { userId: from, connection: pc })
        setPeerConnections(new Map(peerConnectionsRef.current))
      }

      if (data.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.current?.emit("signal", { to: from, from: user!.id, data: answer })
      } else if (data.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data))
      } else if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    })

    socket.current?.on("user-joined", ({ userId, channelId }) => {
      setVoiceChannelUsers((prev) => {
        const updated = new Map(prev)
        const users = updated.get(channelId) ?? new Set()
        users.add(userId)
        updated.set(channelId, users)
        return updated
      })
    })
    
    socket.current?.on("user-left", ({ userId, channelId }) => {
      setVoiceChannelUsers((prev) => {
        const updated = new Map(prev)
        const users = updated.get(channelId)
        if (users) {
          users.delete(userId)
          if (users.size === 0) updated.delete(channelId)
          else updated.set(channelId, users)
        }
        return updated
      })
    })

    socket.current?.on("user-muted", ({ userId, isMuted }) => {
      setMuteStatus((prev) => {
        const updated = new Map(prev)
        updated.set(userId, isMuted)
        return updated
      })
    })
  }

  const initiateConnection = async (participantId: string) => {
    if (!user || !localStreamRef.current) return
    const pc = createPeerConnection(participantId)
    peerConnectionsRef.current.set(participantId, {
      userId: participantId,
      connection: pc,
    })
    setPeerConnections(new Map(peerConnectionsRef.current))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socket.current?.emit("signal", {
      to: participantId,
      from: user.id,
      data: offer,
    })
  }

  const joinVoiceChannel = async (channelId: string, participants: User[]) => {
    if (!user) return
    const stream = await getUserMedia()
    setLocalStream(stream)
    localStreamRef.current = stream
    setIsMicrophoneActive(true)

    socket.current = getSocket()
    socket.current.emit("join", { channelId, userId: user.id })
    handleSignaling()

    for (const p of participants) {
      if (p.id !== user.id) {
        await initiateConnection(p.id)
      }
    }

    setInterval(() => {
      if (!socket.current || !user) return
      const start = Date.now()
      socket.current.emit("ping", () => {
        const duration = Date.now() - start
        setUserPings((prev) => new Map(prev).set(user.id, duration))
      })
    }, 1000)
  }

  const leaveVoiceChannel = () => {
    peerConnectionsRef.current.forEach((p) => p.connection.close())
    peerConnectionsRef.current.clear()
    setPeerConnections(new Map())

    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    setLocalStream(null)
    localStreamRef.current = null
    setIsMicrophoneActive(false)
    setIsSpeaking(false)
    setActiveSpeakers(new Set())

    socket.current?.disconnect()
    socket.current = null
  }

  const toggleMicrophone = () => {
    if (!localStreamRef.current) return
    const track = localStreamRef.current.getAudioTracks()[0]
    track.enabled = !track.enabled
    setIsMicrophoneActive(track.enabled)
  }

  const getAudioLevel = (userId: string): number =>
    audioLevelsRef.current.get(userId) || 0

  const value: WebRTCContextType = {
    localStream,
    peerConnections,
    isMicrophoneActive,
    isSpeaking,
    activeSpeakers,
    logs,
    userPings,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMicrophone,
    getAudioLevel,
    muteStatus,
    voiceChannelUsers, 
  }

  return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
}
