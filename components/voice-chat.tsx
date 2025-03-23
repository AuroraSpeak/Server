"use client"

import { useState, useEffect, useRef } from "react"
import { Mic, MicOff, Settings, PhoneOff, Volume2, VolumeX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { useAppContext } from "@/contexts/app-context"
import { useWebRTC } from "@/contexts/webrtc-context"
import type { User } from "@/contexts/app-context"

interface VoiceChatProps {
  channelName: string
  participants: User[]
}

export default function VoiceChat({ channelName, participants }: VoiceChatProps) {
  const { isMuted, isDeafened, toggleMute, toggleDeafen, leaveVoiceChannel, getAudioLevel } = useAppContext()
  const { isSpeaking, activeSpeakers } = useWebRTC()
  const [volume, setVolume] = useState(80)

  // Audio visualization
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Set up audio visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw audio waves
      ctx.lineWidth = 2
      ctx.strokeStyle = isMuted ? "#ef4444" : "#7c4dff"
      ctx.beginPath()

      const centerY = canvas.height / 2
      const amplitude = isSpeaking ? 20 : 5

      // Draw a sine wave
      for (let x = 0; x < canvas.width; x++) {
        const frequency = isSpeaking ? 0.05 : 0.02
        const y = centerY + Math.sin(x * frequency + Date.now() * 0.005) * amplitude

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isSpeaking, isMuted])

  // Function to get speaking status for a participant
  const isParticipantSpeaking = (participantId: string): boolean => {
    if (participantId === "user-1") {
      // Current user
      return isSpeaking && !isMuted
    }
    return activeSpeakers.has(participantId)
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-aura-bg">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold flex items-center justify-center">
          <Volume2 className="mr-2 text-aura-primary" />
          {channelName}
        </h2>
        <p className="text-aura-text-muted">Voice Channel</p>
      </div>

      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {participants.map((participant) => {
          const isSpeaking = isParticipantSpeaking(participant.id)
          const audioLevel = getAudioLevel(participant.id)
          const ringSize = Math.min(audioLevel / 5, 10) // Scale audio level to ring size

          return (
            <div key={participant.id} className="flex flex-col items-center">
              <div
                className={`relative ${
                  isSpeaking ? "ring-2 ring-aura-primary ring-offset-2 ring-offset-aura-bg animate-pulse" : ""
                } rounded-full`}
                style={{
                  boxShadow: isSpeaking ? `0 0 ${ringSize}px rgba(124, 77, 255, 0.7)` : "none",
                }}
              >
                <Avatar className="h-20 w-20 border-2 border-aura-muted">
                  <AvatarImage src={participant.avatarUrl || "/placeholder.svg?height=80&width=80"} />
                  <AvatarFallback className="bg-aura-primary/20 text-white">
                    {participant.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {participant.id === "user-1" && isMuted && (
                  <div className="absolute bottom-0 right-0 bg-aura-danger text-white rounded-full p-1">
                    <MicOff size={14} />
                  </div>
                )}
                {participant.id === "user-1" && isDeafened && (
                  <div className="absolute bottom-0 left-0 bg-aura-danger text-white rounded-full p-1">
                    <VolumeX size={14} />
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm font-medium">{participant.fullName}</p>
              <div className="flex items-center mt-1 text-xs text-aura-secondary">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-aura-success" : "bg-aura-muted"} mr-1`}></div>
                <span>{Math.floor(Math.random() * 50) + 10}ms</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-4 bg-aura-channels p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-aura-text-muted">Volume</span>
          <span className="text-sm">{volume}%</span>
        </div>
        <Slider value={[volume]} max={100} step={1} onValueChange={(value) => setVolume(value[0])} className="w-full" />

        <div className="h-20 bg-aura-bg rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" width={600} height={100}></canvas>
        </div>
      </div>

      <div className="flex justify-center space-x-2 p-4 mt-4 bg-aura-channels rounded-lg">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleMute}
                className={
                  isMuted ? "bg-aura-danger hover:bg-aura-danger/90" : "bg-aura-primary hover:bg-aura-primary/90"
                }
              >
                {isMuted ? <MicOff /> : <Mic />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMuted ? "Unmute" : "Mute"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isDeafened ? "destructive" : "secondary"}
                size="icon"
                onClick={toggleDeafen}
                className={
                  isDeafened ? "bg-aura-danger hover:bg-aura-danger/90" : "bg-aura-muted/20 hover:bg-aura-muted/30"
                }
              >
                {isDeafened ? <VolumeX /> : <Volume2 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isDeafened ? "Undeafen" : "Deafen"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" className="bg-aura-muted/20 hover:bg-aura-muted/30">
                <Settings />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voice Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="bg-aura-danger hover:bg-aura-danger/90"
                onClick={leaveVoiceChannel}
              >
                <PhoneOff />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Disconnect</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

