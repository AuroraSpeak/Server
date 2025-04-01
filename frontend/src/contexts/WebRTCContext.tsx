"use client"

import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"

interface WebRTCContextType {
  isConnected: boolean
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  connect: (serverId: string) => Promise<void>
  disconnect: () => void
  toggleMute: () => void
  toggleVideo: () => void
  isMuted: boolean
  isVideoEnabled: boolean
}

const WebRTCContext = createContext<WebRTCContextType | null>(null)

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const ws = useRef<WebSocket | null>(null)

  const createPeerConnection = (peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.current?.send(
          JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
            peerId: peerId,
          }),
        )
      }
    }

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev)
        newStreams.set(peerId, event.streams[0])
        return newStreams
      })
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${peerId}:`, pc.iceConnectionState)
    }

    return pc
  }

  const connect = async (serverId: string) => {
    try {
      // WebSocket-Verbindung herstellen
      ws.current = new WebSocket(`ws://localhost:8080/ws/${serverId}`)

      ws.current.onopen = () => {
        setIsConnected(true)
      }

      ws.current.onmessage = async (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case "offer":
            const pc = createPeerConnection(data.peerId)
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            ws.current?.send(
              JSON.stringify({
                type: "answer",
                answer: answer,
                peerId: data.peerId,
              }),
            )

            peerConnections.current.set(data.peerId, pc)
            break

          case "answer":
            const pc2 = peerConnections.current.get(data.peerId)
            if (pc2) {
              await pc2.setRemoteDescription(new RTCSessionDescription(data.answer))
            }
            break

          case "candidate":
            const pc3 = peerConnections.current.get(data.peerId)
            if (pc3) {
              await pc3.addIceCandidate(new RTCIceCandidate(data.candidate))
            }
            break
        }
      }

      // Lokalen Stream abrufen
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      setLocalStream(stream)
    } catch (error) {
      console.error("Fehler beim Verbinden:", error)
      throw error
    }
  }

  const disconnect = () => {
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }

    localStream?.getTracks().forEach((track) => track.stop())
    setLocalStream(null)

    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop())
    })
    setRemoteStreams(new Map())

    peerConnections.current.clear()
    setIsConnected(false)
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return (
    <WebRTCContext.Provider
      value={{
        isConnected,
        localStream,
        remoteStreams,
        connect,
        disconnect,
        toggleMute,
        toggleVideo,
        isMuted,
        isVideoEnabled,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  )
}

export function useWebRTC() {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error("useWebRTC muss innerhalb eines WebRTCProviders verwendet werden")
  }
  return context
}

