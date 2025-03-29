"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Hash, Volume2, Settings, Plus, Headphones, Mic, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth-provider"
import { useAppContext } from "@/contexts/app-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import WebRTCStatus from "./webrtc-status"
import { useCsrfToken } from "@/hooks/useCsrfToken"

interface ChannelSidebarProps {
  activeServer: string
  activeChannel: string
  setActiveChannel: (channelId: string) => void
  channels: any[]
  serverName: string
  currentUser: any
}

export default function AuraChannelSidebar({
  activeServer,
  activeChannel,
  setActiveChannel,
  channels,
  serverName,
  currentUser,
}: ChannelSidebarProps) {
  // Add a helper function at the top of the component to parse role string
  const getRoles = (roleString: string | null): string[] => {
    if (!roleString) return []
    return roleString.split(",").filter(Boolean)
  }

  // Get the logout function from auth provider
  const { logout } = useAuth()

  // Get voice chat functions from context
  const { joinVoiceChannel, isInVoiceChannel, activeVoiceChannel, leaveVoiceChannel } = useAppContext()

  // Group channels by type to simulate categories
  const textChannels = channels.filter((channel) => channel.type === "text" || !channel.name.includes("Voice"))
  const voiceChannels = channels.filter((channel) => channel.type === "voice" || channel.name.includes("Voice"))

  const [expandedCategories, setExpandedCategories] = useState({
    text: true,
    voice: true,
  })

  const { createChannel } = useAppContext()
  const { csrfToken } = useCsrfToken()      

  // State for add channel dialog
  const [showAddChannelDialog, setShowAddChannelDialog] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [channelType, setChannelType] = useState<"text" | "voice">("text")

  const toggleCategory = (category: "text" | "voice") => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleAddChannel = () => {
    setShowAddChannelDialog(true)
  }

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
        alert("Please enter a channel name")
        return
      } 
      

      if (!csrfToken) {
        alert("CSRF token is missing. Please try again.")
        return
      }

      try {
        await createChannel(
          {
            name: newChannelName,
            type: channelType,
          },
          csrfToken
        )
      } catch (error) {
        console.error("Failed to create channel:", error)
        alert("An error occurred while creating the channel. Please try again.")
      } finally {
        setShowAddChannelDialog(false)
        setNewChannelName("")
        setChannelType("text")
      }
  } 

  const handleChannelClick = (channelId: string, channelType: string) => {
    setActiveChannel(channelId)

    // If it's a voice channel and we're not already in it
    if (channelType === "voice" && (!isInVoiceChannel || activeVoiceChannel !== channelId)) {
      joinVoiceChannel(channelId)
    }
  }

  return (
    <div className="aura-channels flex flex-col h-full bg-aura-channels">
      {/* Server header */}
      <div className="p-4 border-b border-aura-bg shadow-sm flex items-center justify-between">
        <h1 className="font-bold truncate text-white">{serverName}</h1>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
          <ChevronDown size={16} />
        </Button>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2 scrollable">
        {/* WebRTC Status */}
        {isInVoiceChannel && (
          <div className="px-3 py-2 mb-2">
            <WebRTCStatus />
          </div>
        )}

        {/* Text Channels */}
        <Collapsible open={expandedCategories.text} onOpenChange={() => toggleCategory("text")}>
          <CollapsibleTrigger className="w-full">
            <div className="aura-category flex items-center px-3 py-1 cursor-pointer text-aura-text-muted hover:text-aura-interactive">
              {expandedCategories.text ? (
                <ChevronDown size={12} className="mr-1" />
              ) : (
                <ChevronRight size={12} className="mr-1" />
              )}
              <span className="text-xs font-semibold">TEXT CHANNELS</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {textChannels.map((channel) => (
              <button
                key={channel.id}
                className={cn(
                  "aura-channel flex items-center w-full text-left px-3 py-1 my-1 rounded hover:bg-aura-muted text-gray-200 hover:text-white",
                  activeChannel === channel.id && "bg-aura-primary/20 text-white font-medium",
                )}
                onClick={() => handleChannelClick(channel.id, "text")}
              >
                <Hash size={18} className="mr-2 flex-shrink-0" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}

            <button
              className="aura-channel add-channel flex items-center w-full text-left px-3 py-1 my-1 rounded hover:bg-aura-muted hover:text-white"
              onClick={handleAddChannel}
            >
              <Plus size={18} className="mr-2 flex-shrink-0" />
              <span className="truncate">Add Channel</span>
            </button>
          </CollapsibleContent>
        </Collapsible>

        {/* Voice Channels */}
        <Collapsible open={expandedCategories.voice} onOpenChange={() => toggleCategory("voice")}>
          <CollapsibleTrigger className="w-full">
            <div className="aura-category flex items-center px-3 py-1 cursor-pointer text-aura-text-muted hover:text-aura-interactive mt-4">
              {expandedCategories.voice ? (
                <ChevronDown size={12} className="mr-1" />
              ) : (
                <ChevronRight size={12} className="mr-1" />
              )}
              <span className="text-xs font-semibold">VOICE CHANNELS</span>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {voiceChannels.map((channel) => (
              <button
                key={channel.id}
                className={cn(
                  "aura-channel flex items-center w-full text-left px-3 py-1 my-1 rounded hover:bg-aura-muted text-gray-200 hover:text-white",
                  activeChannel === channel.id && "bg-aura-primary/20 text-white",
                  isInVoiceChannel && activeVoiceChannel === channel.id && "bg-green-600/20 text-white",
                )}
                onClick={() => handleChannelClick(channel.id, "voice")}
              >
                <Volume2 size={18} className="mr-2 flex-shrink-0" />
                <span className="truncate">{channel.name}</span>
                {isInVoiceChannel && activeVoiceChannel === channel.id && (
                  <span className="ml-auto text-xs bg-green-600/30 text-white px-1.5 py-0.5 rounded">Connected</span>
                )}
              </button>
            ))}

            <button
              className="aura-channel add-channel flex items-center w-full text-left px-3 py-1 my-1 rounded hover:bg-aura-muted hover:text-white"
              onClick={handleAddChannel}
            >
              <Plus size={18} className="mr-2 flex-shrink-0" />
              <span className="truncate">Add Voice Channel</span>
            </button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* User panel */}
      {currentUser && (
        <div className="p-2 bg-aura-bg mt-auto flex items-center">
          <div className="flex items-center flex-1 min-w-0">
            <div className="avatar-with-status relative mr-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback className="bg-aura-primary/30 text-white">
                  {currentUser.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="status-indicator status-online"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{currentUser.fullName}</p>
              <p className="text-xs text-aura-text-muted truncate">Online</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-aura-interactive hover:text-aura-interactive-hover hover:bg-aura-muted rounded-md"
            >
              <Mic size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-aura-interactive hover:text-aura-interactive-hover hover:bg-aura-muted rounded-md"
            >
              <Headphones size={18} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-aura-interactive hover:text-aura-interactive-hover hover:bg-aura-muted rounded-md"
                >
                  <Settings size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-aura-bg border-aura-muted">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-aura-danger cursor-pointer focus:bg-aura-danger/10 focus:text-aura-danger"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Add Channel Dialog */}
      <Dialog open={showAddChannelDialog} onOpenChange={setShowAddChannelDialog}>
        <DialogContent className="bg-aura-bg border-aura-muted text-white">
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="new-channel"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="bg-aura-muted border-aura-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Channel Type</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={channelType === "text"}
                    onChange={() => setChannelType("text")}
                    className="accent-aura-primary"
                  />
                  <span>Text Channel</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={channelType === "voice"}
                    onChange={() => setChannelType("voice")}
                    className="accent-aura-primary"
                  />
                  <span>Voice Channel</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddChannelDialog(false)}
              className="border-aura-muted text-white hover:bg-aura-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChannel}
              className="bg-aura-primary hover:bg-aura-primary/90"
              disabled={!newChannelName.trim()}
            >
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}