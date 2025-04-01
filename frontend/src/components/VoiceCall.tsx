"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { voiceService } from "../services/voice"
import type { VoiceCall as VoiceCallType } from "../services/voice"
import { Mic, MicOff, PhoneOff } from "lucide-react"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card, CardContent } from "./ui/card"

interface VoiceCallProps {
  targetUserId: string
  onCallEnd: () => void
}

export const VoiceCall: React.FC<VoiceCallProps> = ({ targetUserId, onCallEnd }) => {
  const [call, setCall] = useState<VoiceCallType | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set())
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map())

  useEffect(() => {
    const initializeCall = async () => {
      try {
        const newCall = await voiceService.initiateCall(targetUserId)
        setCall(newCall)

        voiceService.onRemoteStream((stream: MediaStream) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream
          }

          // Store the stream for later use
          remoteStreams.current.set(targetUserId, stream)
        })

        voiceService.onSpeakingStateChanged(({ userId, isSpeaking }) => {
          setActiveSpeakers((prev) => {
            const newSpeakers = new Set(prev)
            if (isSpeaking) {
              newSpeakers.add(userId)
            } else {
              newSpeakers.delete(userId)
            }
            return newSpeakers
          })
        })

        voiceService.onCallStatusChanged((updatedCall) => {
          setCall(updatedCall)
        })
      } catch (error) {
        console.error("Error initializing call:", error)
      }
    }

    initializeCall()

    return () => {
      voiceService.endCall()
    }
  }, [targetUserId])

  const handleEndCall = async () => {
    await voiceService.endCall()
    onCallEnd()
  }

  const handleToggleMute = () => {
    const muted = voiceService.toggleMute()
    setIsMuted(muted)
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-lg font-semibold">
            {call?.status === "active" ? "Anruf läuft..." : "Verbindung wird hergestellt..."}
          </div>

          <div className="flex flex-wrap justify-center gap-4 my-4">
            {/* Local user */}
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <div className="relative">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                {activeSpeakers.has("local") && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-background"></span>
                )}
              </div>
              <h4 className="font-medium mb-2">Du</h4>
              <audio ref={localAudioRef} autoPlay muted />
            </div>

            {/* Remote user */}
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <div className="relative">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" />
                  <AvatarFallback>RM</AvatarFallback>
                </Avatar>
                {activeSpeakers.has(targetUserId) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-background"></span>
                )}
              </div>
              <h4 className="font-medium mb-2">Gesprächspartner</h4>
              <audio ref={remoteAudioRef} autoPlay />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleToggleMute}
              variant="outline"
              size="icon"
              className={isMuted ? "bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600" : ""}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            <Button onClick={handleEndCall} variant="destructive" className="px-4 py-2 rounded-full">
              <PhoneOff className="h-5 w-5 mr-2" />
              Anruf beenden
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

