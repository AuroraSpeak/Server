"use client"

import { useEffect, useState } from "react"
import { useWebRTC } from "@/contexts/webrtc-context"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wifi, WifiOff, AlertCircle } from "lucide-react"

export default function WebRTCStatus() {
  const { peerConnections } = useWebRTC()
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("disconnected")

  useEffect(() => {
    // Check connection status
    if (peerConnections.size === 0) {
      setConnectionStatus("disconnected")
      return
    }

    // Check if all connections are established
    let allConnected = true
    let anyConnected = false

    peerConnections.forEach((peer) => {
      if (peer.connection.connectionState === "connected") {
        anyConnected = true
      } else {
        allConnected = false
      }
    })

    if (allConnected && anyConnected) {
      setConnectionStatus("connected")
    } else if (anyConnected) {
      setConnectionStatus("connecting")
    } else {
      setConnectionStatus("disconnected")
    }
  }, [peerConnections])

  if (connectionStatus === "disconnected") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              <WifiOff size={12} className="mr-1" />
              <span>Disconnected</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Not connected to any voice channel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (connectionStatus === "connecting") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
              <AlertCircle size={12} className="mr-1" />
              <span>Connecting...</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Establishing WebRTC connections</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Wifi size={12} className="mr-1" />
            <span>Connected</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>WebRTC connections established</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

