"use client"

import { useState } from "react"
import { Mic, MicOff, Settings, PhoneOff, Volume2, VolumeX, Zap, Crown, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const participants = [
  {
    id: 1,
    name: "NightStalker",
    speaking: true,
    muted: false,
    deafened: false,
    avatar: "/placeholder.svg?height=80&width=80",
    role: "leader",
    game: "Apex Legends",
    ping: 32,
  },
  {
    id: 2,
    name: "FragMaster",
    speaking: false,
    muted: true,
    deafened: false,
    avatar: "/placeholder.svg?height=80&width=80",
    role: "member",
    game: "Call of Duty: Warzone",
    ping: 45,
  },
  {
    id: 3,
    name: "LootQueen",
    speaking: false,
    muted: false,
    deafened: false,
    avatar: "/placeholder.svg?height=80&width=80",
    role: "moderator",
    game: "Destiny 2",
    ping: 28,
  },
  {
    id: 4,
    name: "SniperElite",
    speaking: true,
    muted: false,
    deafened: false,
    avatar: "/placeholder.svg?height=80&width=80",
    role: "member",
    game: "Valorant",
    ping: 18,
  },
]

export default function GamingVoiceChat() {
  const [muted, setMuted] = useState(false)
  const [deafened, setDeafened] = useState(false)
  const [volume, setVolume] = useState(80)

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "leader":
        return <Crown size={14} className="text-yellow-400" />
      case "moderator":
        return <Shield size={14} className="text-gaming-secondary" />
      default:
        return null
    }
  }

  return (
    <Card className="border-gaming-border bg-gaming-card/80 backdrop-blur-sm">
      <CardHeader className="pb-2 border-b border-gaming-border">
        <CardTitle className="text-base flex items-center">
          <Zap size={16} className="mr-2 text-gaming-primary" />
          Squad Voice Channel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {participants.map((participant) => (
            <div key={participant.id} className="flex flex-col items-center">
              <div
                className={`relative ${
                  participant.speaking && !participant.muted
                    ? "ring-2 ring-gaming-primary ring-offset-2 ring-offset-gaming-dark animate-pulse"
                    : ""
                } rounded-full`}
              >
                <Avatar className="h-20 w-20 border-2 border-gaming-border">
                  <AvatarImage src={participant.avatar} />
                  <AvatarFallback className="bg-gaming-primary/20 text-gaming-primary">
                    {participant.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  {getRoleIcon(participant.role)}
                </div>
                {participant.muted && (
                  <div className="absolute bottom-0 right-0 bg-gaming-accent text-white rounded-full p-1">
                    <MicOff size={14} />
                  </div>
                )}
                {participant.deafened && (
                  <div className="absolute bottom-0 left-0 bg-gaming-accent text-white rounded-full p-1">
                    <VolumeX size={14} />
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm font-medium">{participant.name}</p>
              <div className="flex items-center mt-1 text-xs text-gaming-secondary">
                <div className="w-2 h-2 rounded-full bg-gaming-success mr-1"></div>
                <span>{participant.ping}ms</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Volume</span>
            <span className="text-sm">{volume}%</span>
          </div>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0])}
            className="w-full"
          />
        </div>

        <div className="flex justify-center space-x-2 p-4 mt-4 bg-gaming-dark/50 rounded-lg">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={muted ? "destructive" : "secondary"}
                  size="icon"
                  onClick={() => setMuted(!muted)}
                  className={
                    muted
                      ? "bg-gaming-accent hover:bg-gaming-accent/90"
                      : "bg-gaming-primary hover:bg-gaming-primary/90"
                  }
                >
                  {muted ? <MicOff /> : <Mic />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{muted ? "Unmute" : "Mute"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={deafened ? "destructive" : "secondary"}
                  size="icon"
                  onClick={() => setDeafened(!deafened)}
                  className={deafened ? "bg-gaming-accent hover:bg-gaming-accent/90" : "bg-muted/20 hover:bg-muted/30"}
                >
                  {deafened ? <VolumeX /> : <Volume2 />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{deafened ? "Undeafen" : "Deafen"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="icon" className="bg-muted/20 hover:bg-muted/30">
                  <Settings />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voice Settings</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" className="bg-gaming-accent hover:bg-gaming-accent/90">
                  <PhoneOff />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disconnect</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  )
}

