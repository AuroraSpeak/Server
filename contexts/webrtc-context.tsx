"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import type { User } from "@/contexts/app-context"

// Define types for our WebRTC context
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
  joinVoiceChannel: (channelId: string, participants: User[]) => Promise<void>
  leaveVoiceChannel: () => void
  toggleMicrophone: () => void
  getAudioLevel: (userId: string) => number
}

const WebRTCContext = createContext<WebRTCContextType | null>(null)

export const useWebRTC = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error("useWebRTC must be used within a WebRTCProvider")
  }
  return context
}

// Configuration for RTCPeerConnection
const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
}

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peerConnections, setPeerConnections] = useState<Map<string, PeerConnection>>(new Map())
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set())

  // Refs to maintain state in callbacks
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map())
  const activeChannelRef = useRef<string | null>(null)

  // Audio processing for speech detection
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioAnalyserRef = useRef<AnalyserNode | null>(null)
  const audioLevelsRef = useRef<Map<string, number>>(new Map())

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      leaveVoiceChannel()
    }
  }, [])

  // Function to get user media (microphone)
  const getUserMedia = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      // Set up audio processing for speech detection
      if (audioContextRef.current && stream) {
        const audioSource = audioContextRef.current.createMediaStreamSource(stream)
        const analyser = audioContextRef.current.createAnalyser()
        analyser.fftSize = 256
        audioSource.connect(analyser)
        audioAnalyserRef.current = analyser

        // Start monitoring audio levels
        monitorAudioLevels()
      }

      return stream
    } catch (error) {
      console.error("Error accessing microphone:", error)
      throw error
    }
  }

  // Monitor audio levels to detect speaking
  const monitorAudioLevels = () => {
    if (!audioAnalyserRef.current) return

    const analyser = audioAnalyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const checkAudioLevel = () => {
      if (!analyser) return

      analyser.getByteFrequencyData(dataArray)

      // Calculate average volume level
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const average = sum / dataArray.length

      // Update speaking state based on threshold
      const isSpeakingNow = average > 20 // Adjust threshold as needed
      setIsSpeaking(isSpeakingNow)

      // Store local user's audio level
      if (user) {
        audioLevelsRef.current.set(user.id, average)
      }

      requestAnimationFrame(checkAudioLevel)
    }

    checkAudioLevel()
  }

  // Create a peer connection for a participant
  const createPeerConnection = (participantId: string): RTCPeerConnection => {
    console.log(`Creating peer connection for ${participantId}`)

    const peerConnection = new RTCPeerConnection(rtcConfig)

    // Add local tracks to the peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        if (localStreamRef.current) {
          peerConnection.addTrack(track, localStreamRef.current)
        }
      })
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real app, send this candidate to the remote peer via signaling server
        console.log("New ICE candidate:", event.candidate)

        // Simulate sending the ICE candidate to the remote peer
        setTimeout(() => {
          // This simulates receiving the ICE candidate on the other peer
          // In a real app, this would happen through your signaling server
        }, 500)
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state for ${participantId}:`, peerConnection.connectionState)
    }

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${participantId}:`, peerConnection.iceConnectionState)
    }

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log(`Received track from ${participantId}:`, event.track.kind)

      // Only handle audio tracks
      if (event.track.kind === "audio") {
        const audioStream = new MediaStream([event.track])

        // Create audio element to play the remote stream
        const audioElement = new Audio()
        audioElement.srcObject = audioStream
        audioElement.autoplay = true

        // Set up audio processing for this remote stream
        if (audioContextRef.current) {
          const audioSource = audioContextRef.current.createMediaStreamSource(audioStream)
          const analyser = audioContextRef.current.createAnalyser()
          analyser.fftSize = 256
          audioSource.connect(analyser)

          // Monitor audio levels for this remote peer
          const dataArray = new Uint8Array(analyser.frequencyBinCount)

          const checkRemoteAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray)

            // Calculate average volume level
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i]
            }
            const average = sum / dataArray.length

            // Store remote user's audio level
            audioLevelsRef.current.set(participantId, average)

            // Update active speakers
            if (average > 20) {
              // Adjust threshold as needed
              setActiveSpeakers((prev) => {
                const updated = new Set(prev)
                updated.add(participantId)
                return updated
              })
            } else {
              setActiveSpeakers((prev) => {
                const updated = new Set(prev)
                updated.delete(participantId)
                return updated
              })
            }

            // Continue monitoring if we're still connected
            if (peerConnectionsRef.current.has(participantId)) {
              requestAnimationFrame(checkRemoteAudioLevel)
            }
          }

          checkRemoteAudioLevel()
        }

        // Update the peer connection with the new audio stream
        const updatedConnection = peerConnectionsRef.current.get(participantId)
        if (updatedConnection) {
          peerConnectionsRef.current.set(participantId, {
            ...updatedConnection,
            audioStream,
            audioTrack: event.track,
          })

          setPeerConnections(new Map(peerConnectionsRef.current))
        }
      }
    }

    return peerConnection
  }

  // Initiate WebRTC connection with a participant
  const initiateConnection = async (participantId: string): Promise<void> => {
    if (!user || !localStreamRef.current) return

    // Create a new peer connection
    const peerConnection = createPeerConnection(participantId)

    // Store the connection
    peerConnectionsRef.current.set(participantId, {
      userId: participantId,
      connection: peerConnection,
    })

    setPeerConnections(new Map(peerConnectionsRef.current))

    try {
      // Create an offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      })

      // Set local description
      await peerConnection.setLocalDescription(offer)

      // In a real app, send this offer to the remote peer via signaling server
      console.log("Created offer:", offer)

      // Simulate receiving an answer from the remote peer
      setTimeout(async () => {
        // This simulates receiving the answer from the other peer
        // In a real app, this would happen through your signaling server
        const simulatedAnswer = {
          type: "answer",
          sdp: offer.sdp, // In a real app, this would be the actual answer from the remote peer
        } as RTCSessionDescriptionInit

        // Set remote description
        if (peerConnection.signalingState !== "closed") {
          await peerConnection.setRemoteDescription(simulatedAnswer)
        }
      }, 1000)
    } catch (error) {
      console.error(`Error initiating connection with ${participantId}:`, error)
    }
  }

  // Join a voice channel
  const joinVoiceChannel = async (channelId: string, participants: User[]): Promise<void> => {
    if (!user) return

    // Leave current channel if any
    if (activeChannelRef.current) {
      leaveVoiceChannel()
    }

    try {
      // Get user media (microphone)
      const stream = await getUserMedia()
      setLocalStream(stream)
      localStreamRef.current = stream
      setIsMicrophoneActive(true)

      // Set active channel
      activeChannelRef.current = channelId

      // Initiate connections with all participants except self
      for (const participant of participants) {
        if (participant.id !== user.id) {
          await initiateConnection(participant.id)
        }
      }

      console.log(`Joined voice channel ${channelId} with ${participants.length - 1} other participants`)
    } catch (error) {
      console.error("Error joining voice channel:", error)
    }
  }

  // Leave the current voice channel
  const leaveVoiceChannel = (): void => {
    // Close all peer connections
    peerConnectionsRef.current.forEach((peer) => {
      peer.connection.close()
    })

    // Clear peer connections
    peerConnectionsRef.current.clear()
    setPeerConnections(new Map())

    // Stop local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Reset state
    setLocalStream(null)
    localStreamRef.current = null
    setIsMicrophoneActive(false)
    setIsSpeaking(false)
    setActiveSpeakers(new Set())
    activeChannelRef.current = null

    console.log("Left voice channel")
  }

  // Toggle microphone
  const toggleMicrophone = (): void => {
    if (!localStreamRef.current) return

    const audioTracks = localStreamRef.current.getAudioTracks()
    if (audioTracks.length > 0) {
      const enabled = !audioTracks[0].enabled
      audioTracks[0].enabled = enabled
      setIsMicrophoneActive(enabled)

      // Update all peer connections
      peerConnectionsRef.current.forEach((peer) => {
        const senders = peer.connection.getSenders()
        senders.forEach((sender) => {
          if (sender.track && sender.track.kind === "audio") {
            sender.track.enabled = enabled
          }
        })
      })
    }
  }

  // Get audio level for a user
  const getAudioLevel = (userId: string): number => {
    return audioLevelsRef.current.get(userId) || 0
  }

  // Context value
  const contextValue: WebRTCContextType = {
    localStream,
    peerConnections,
    isMicrophoneActive,
    isSpeaking,
    activeSpeakers,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMicrophone,
    getAudioLevel,
  }

  return <WebRTCContext.Provider value={contextValue}>{children}</WebRTCContext.Provider>
}

