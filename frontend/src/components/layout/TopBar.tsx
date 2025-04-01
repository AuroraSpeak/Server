"use client"

import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Mic, MicOff, Headphones, VolumeX, User, LogOut, Settings, Moon, Sun } from "lucide-react"
import { Button } from "../ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { useWebRTC } from "../../contexts/WebRTCContext"
import { useTheme } from "../theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { serverService } from "@/services/server"
import VoiceStatus from "../VoiceStatus"

export default function TopBar() {
  const { serverId } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const {
    isConnected,
    isConnecting,
    toggleMute,
    isMuted,
    isVideoEnabled,
    connect,
    disconnect,
    currentChannelId,
    activeSpeakers,
  } = useWebRTC()
  const [isDeafened, setIsDeafened] = useState(false)
  const [serverName, setServerName] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  React.useEffect(() => {
    if (serverId) {
      serverService
        .getServerById(serverId)
        .then((server) => setServerName(server.name))
        .catch((err) => console.error("Failed to fetch server:", err))
    } else {
      setServerName(null)
    }
  }, [serverId])

  const handleToggleDeafen = () => {
    setIsDeafened(!isDeafened)
    // Implement deafen functionality
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleVoiceConnect = async () => {
    if (!serverId) return

    if (isConnected) {
      disconnect()
    } else {
      // Find the first voice channel in the server
      const voiceChannelId = "4" // This would normally come from your channel list
      try {
        await connect(serverId, voiceChannelId)
        navigate(`/server/${serverId}?channel=${voiceChannelId}&tab=voice`)
      } catch (error) {
        console.error("Failed to connect to voice:", error)
      }
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          {serverName && <div className="mr-auto font-semibold">{serverName}</div>}

          <div className="ml-auto flex items-center space-x-2">
            <VoiceStatus className="mr-2" />
            {isConnected && (
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded-md mr-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-muted-foreground">Voice Connected</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={toggleMute}>
                  {isMuted ? <MicOff className="h-3 w-3 text-red-500" /> : <Mic className="h-3 w-3" />}
                </Button>
              </div>
            )}
            {serverId && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full ${isConnected ? "text-green-500 hover:text-green-600" : "hover:bg-muted"}`}
                      onClick={handleVoiceConnect}
                    >
                      <Headphones className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isConnected ? "Sprachkanal verlassen" : "Sprachkanal beitreten"}</p>
                  </TooltipContent>
                </Tooltip>

                {isConnected && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full ${isMuted ? "text-red-500 hover:text-red-600" : "hover:bg-muted"}`}
                          onClick={toggleMute}
                        >
                          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isMuted ? "Mikrofon aktivieren" : "Mikrofon deaktivieren"}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full ${isDeafened ? "text-red-500 hover:text-red-600" : "hover:bg-muted"}`}
                          onClick={handleToggleDeafen}
                        >
                          {isDeafened ? <VolumeX className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isDeafened ? "Audio aktivieren" : "Audio deaktivieren"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={handleToggleTheme}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{theme === "dark" ? "Light Mode" : "Dark Mode"}</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Benutzer</p>
                    <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Einstellungen</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Abmelden</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}

