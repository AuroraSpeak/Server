"use client"

import { useWebRTC } from "@/contexts/WebRTCContext"
import { Mic, MicOff, PhoneOff } from "lucide-react"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

interface VoiceStatusProps {
  className?: string
}

export default function VoiceStatus({ className }: VoiceStatusProps) {
  const { isConnected, isMuted, toggleMute, disconnect, currentChannelId } = useWebRTC()

  if (!isConnected) return null

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md ${className}`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-xs">Voice Connected</span>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={toggleMute}>
                {isMuted ? <MicOff className="h-3 w-3 text-red-500" /> : <Mic className="h-3 w-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isMuted ? "Unmute" : "Mute"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={disconnect}>
                <PhoneOff className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Disconnect</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

