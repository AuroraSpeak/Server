"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Hash, Volume2, LogOut, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface ChannelSidebarProps {
  channels: any[]
  activeChannel: string
  setActiveChannel: (channelId: string) => void
  serverName: string
}

export default function ChannelSidebar({ channels, activeChannel, setActiveChannel, serverName }: ChannelSidebarProps) {
  const textChannels = channels.filter((channel) => channel.type === "text")
  const voiceChannels = channels.filter((channel) => channel.type === "voice")

  const [textExpanded, setTextExpanded] = useState(true)
  const [voiceExpanded, setVoiceExpanded] = useState(true)

  // Get the logout function from auth provider
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="channel-sidebar flex flex-col">
      <div className="server-header">
        <h1 className="text-white font-semibold">{serverName}</h1>
        <button className="ml-auto">
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollable">
        {/* Text channels */}
        <div className="px-1">
          <div className="channel-category" onClick={() => setTextExpanded(!textExpanded)}>
            {textExpanded ? <ChevronDown size={12} className="mr-1" /> : <ChevronRight size={12} className="mr-1" />}
            <span>TEXT CHANNELS</span>
          </div>

          {textExpanded &&
            textChannels.map((channel) => (
              <div
                key={channel.id}
                className={cn("channel-item", activeChannel === channel.id && "active")}
                onClick={() => setActiveChannel(channel.id)}
              >
                <Hash size={18} className="mr-2 flex-shrink-0" />
                <span>{channel.name}</span>
              </div>
            ))}
        </div>

        {/* Voice channels */}
        <div className="px-1 mt-2">
          <div className="channel-category" onClick={() => setVoiceExpanded(!voiceExpanded)}>
            {voiceExpanded ? <ChevronDown size={12} className="mr-1" /> : <ChevronRight size={12} className="mr-1" />}
            <span>VOICE CHANNELS</span>
          </div>

          {voiceExpanded &&
            voiceChannels.map((channel) => (
              <div
                key={channel.id}
                className={cn("channel-item", activeChannel === channel.id && "active")}
                onClick={() => setActiveChannel(channel.id)}
              >
                <Volume2 size={18} className="mr-2 flex-shrink-0" />
                <span>{channel.name}</span>
              </div>
            ))}
        </div>
      </div>

      {/* User panel */}
      <div className="user-panel">
        <div className="user-avatar">
          <div className="w-8 h-8 rounded-full bg-[hsl(262,70%,40%)] flex items-center justify-center">U</div>
          <div className="status-indicator status-online"></div>
        </div>
        <div className="ml-2 flex-1">
          <div className="user-name">Username</div>
          <div className="user-status">Online</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white">
              <Settings size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

