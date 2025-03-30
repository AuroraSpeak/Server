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

  // Update styling classes to use the Tailwind classes that reference our custom variables
  const statusClasses = {
    connected: "bg-green-500/10 text-green-500 border-green-500/20",
    connecting: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    disconnected: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  const statusIcons = {
    connected: <Wifi size={12} className="mr-1" />,
    connecting: <AlertCircle size={12} className="mr-1" />,
    disconnected: <WifiOff size={12} className="mr-1" />,
  }

  const statusText = {
    connected: "Connected",
    connecting: "Connecting...",
    disconnected: "Disconnected",
  }

  const tooltipText = {
    connected: "WebRTC connections established",
    connecting: "Establishing WebRTC connections",
    disconnected: "Not connected to any voice channel",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${statusClasses[connectionStatus]} flex items-center`}>
            {statusIcons[connectionStatus]}
            <span>{statusText[connectionStatus]}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText[connectionStatus]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

