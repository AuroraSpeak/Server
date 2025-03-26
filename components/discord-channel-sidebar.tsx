"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Hash, Volume2, Settings, Plus, Headphones, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

interface ChannelSidebarProps {
  activeServer: string
  activeChannel: string
  setActiveChannel: (channelId: string) => void
  channels: any[]
  serverName: string
  currentUser: any
}

export default function DiscordChannelSidebar({
  activeServer,
  activeChannel,
  setActiveChannel,
  channels,
  serverName,
  currentUser,
}: ChannelSidebarProps) {
  // Group channels by type to simulate categories
  const textChannels = channels.filter((channel) => !channel.name.includes("Voice"))
  const voiceChannels = channels.filter((channel) => channel.name.includes("Voice"))

  const [expandedCategories, setExpandedCategories] = useState({
    text: true,
    voice: true,
  })

  const toggleCategory = (category: "text" | "voice") => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="discord-channels flex flex-col h-full">
      {/* Server header */}
      <div className="p-4 border-b border-discord-bg shadow-sm flex items-center justify-between">
        <h1 className="font-bold truncate">{serverName}</h1>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
          <ChevronDown size={16} />
        </Button>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Text Channels */}
        <Collapsible open={expandedCategories.text} onOpenChange={() => toggleCategory("text")}>
          <CollapsibleTrigger className="w-full">
            <div className="discord-category flex items-center px-1 py-1 cursor-pointer">
              {expandedCategories.text ? (
                <ChevronDown size={12} className="mr-1" />
              ) : (
                <ChevronRight size={12} className="mr-1" />
              )}
              <span>TEXT CHANNELS</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {textChannels.map((channel) => (
              <button
                key={channel.id}
                className={cn(
                  "discord-channel flex items-center w-full text-left",
                  activeChannel === channel.id && "active",
                )}
                onClick={() => setActiveChannel(channel.id)}
              >
                <Hash size={18} className="mr-2 flex-shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}

            <button className="discord-channel flex items-center w-full text-left opacity-0 group-hover:opacity-100 hover:opacity-100">
              <Plus size={18} className="mr-2 flex-shrink-0" />
              <span className="truncate">Add Channel</span>
            </button>
          </CollapsibleContent>
        </Collapsible>

        {/* Voice Channels */}
        <Collapsible open={expandedCategories.voice} onOpenChange={() => toggleCategory("voice")}>
          <CollapsibleTrigger className="w-full">
            <div className="discord-category flex items-center px-1 py-1 cursor-pointer">
              {expandedCategories.voice ? (
                <ChevronDown size={12} className="mr-1" />
              ) : (
                <ChevronRight size={12} className="mr-1" />
              )}
              <span>VOICE CHANNELS</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {voiceChannels.map((channel) => (
              <button
                key={channel.id}
                className={cn(
                  "discord-channel flex items-center w-full text-left",
                  activeChannel === channel.id && "active",
                )}
                onClick={() => setActiveChannel(channel.id)}
              >
                <Volume2 size={18} className="mr-2 flex-shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}

            <button className="discord-channel flex items-center w-full text-left opacity-0 group-hover:opacity-100 hover:opacity-100">
              <Plus size={18} className="mr-2 flex-shrink-0" />
              <span className="truncate">Add Channel</span>
            </button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* User panel */}
      {currentUser && (
        <div className="p-2 bg-discord-bg mt-auto flex items-center">
          <div className="flex items-center flex-1 min-w-0">
            <div className="relative mr-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>{currentUser.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-bg status-online"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.fullName}</p>
              <p className="text-xs text-discord-text-muted truncate">#0000</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-discord-interactive hover:text-discord-interactive-hover"
            >
              <Mic size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-discord-interactive hover:text-discord-interactive-hover"
            >
              <Headphones size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-discord-interactive hover:text-discord-interactive-hover"
            >
              <Settings size={18} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

