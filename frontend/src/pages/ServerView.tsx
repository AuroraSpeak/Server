"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Send, Mic, MicOff, PhoneOff, Users, Hash, Settings, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWebRTC } from "@/contexts/WebRTCContext"
import { serverService, type Server, type ServerStats } from "../services/server"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"

interface Message {
  id: string
  user: { id: string; name: string; avatar: string }
  content: string
  timestamp: string
}

interface VoiceUser {
  id: string
  name: string
  isSpeaking: boolean
  isMuted: boolean
  avatar: string
}

interface Channel {
  id: string
  name: string
  type: "text" | "voice"
}

export default function ServerView() {
  const {
    isConnected,
    isConnecting,
    localStream,
    remoteStreams,
    connect,
    disconnect,
    toggleMute,
    isMuted,
    activeSpeakers,
    currentChannelId,
    error,
  } = useWebRTC()
  const { serverId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState("")
  const [server, setServer] = useState<Server | null>(null)
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"text" | "voice">("text")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Mock data for demonstration
  useEffect(() => {
    // Mock channels
    setChannels([
      { id: "1", name: "allgemein", type: "text" },
      { id: "2", name: "gaming", type: "text" },
      { id: "3", name: "musik", type: "text" },
      { id: "4", name: "Allgemeiner Sprachkanal", type: "voice" },
      { id: "5", name: "Gaming", type: "voice" },
    ])
    setActiveChannel("1")

    // Mock voice users
    setVoiceUsers([
      { id: "1", name: "Max", isSpeaking: true, isMuted: false, avatar: "/placeholder.svg?height=40&width=40" },
      { id: "2", name: "Anna", isSpeaking: false, isMuted: true, avatar: "/placeholder.svg?height=40&width=40" },
      { id: "3", name: "Tom", isSpeaking: false, isMuted: false, avatar: "/placeholder.svg?height=40&width=40" },
    ])

    // Mock messages
    setMessages([
      {
        id: "1",
        user: { id: "1", name: "Max", avatar: "/placeholder.svg?height=40&width=40" },
        content: "Hallo zusammen! Wie geht es euch?",
        timestamp: "14:30",
      },
      {
        id: "2",
        user: { id: "2", name: "Anna", avatar: "/placeholder.svg?height=40&width=40" },
        content: "Mir geht es gut, danke! Was machen wir heute?",
        timestamp: "14:32",
      },
      {
        id: "3",
        user: { id: "3", name: "Tom", avatar: "/placeholder.svg?height=40&width=40" },
        content: "Ich würde gerne ein paar Runden spielen. Wer ist dabei?",
        timestamp: "14:35",
      },
    ])
  }, [])

  useEffect(() => {
    const fetchServerData = async () => {
      if (!serverId) return
      try {
        const [serverData, statsData] = await Promise.all([
          serverService.getServerById(serverId),
          serverService.getServerStats(serverId),
        ])
        setServer(serverData)
        setStats(statsData)
      } catch (error) {
        toast({
          title: "Fehler beim Laden des Servers",
          description: "Bitte versuchen Sie es später erneut.",
          variant: "destructive",
        })
        navigate("/")
      }
    }

    fetchServerData()
    // Aktualisiere die Server-Statistiken alle 30 Sekunden
    const interval = setInterval(fetchServerData, 30000)
    return () => clearInterval(interval)
  }, [serverId, toast, navigate])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !serverId || !activeChannel) return

    try {
      // In a real app, this would send the message to the server
      const newMessage: Message = {
        id: Date.now().toString(),
        user: { id: "me", name: "Ich", avatar: "/placeholder.svg?height=40&width=40" },
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, newMessage])
      setMessage("")
    } catch (error) {
      toast({
        title: "Fehler beim Senden der Nachricht",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    }
  }

  const handleJoinVoiceChannel = async (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId)
    if (!channel || !serverId) return

    if (channel.type === "voice") {
      setActiveChannel(channelId)
      setActiveTab("voice")

      if (isConnected) {
        // If already connected to this channel, do nothing
        if (currentChannelId === channelId) {
          return
        }

        // If connected to a different channel, disconnect first
        await disconnect()
      }

      try {
        // Connect to the voice channel
        await connect(serverId, channelId)
      } catch (error) {
        console.error("Failed to connect to voice channel:", error)
        toast({
          title: "Verbindungsfehler",
          description: "Konnte nicht mit dem Sprachkanal verbinden.",
          variant: "destructive",
        })
      }
    } else {
      // Text channel
      setActiveChannel(channelId)
      setActiveTab("text")
    }
  }

  if (!server) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Lade Server...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Channel Sidebar */}
      <div className="w-60 border-r bg-muted/20">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">{server.name}</h2>
          {stats && (
            <div className="text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="mr-1">
                {server.status}
              </Badge>
              <span className="mr-2">CPU: {stats.cpu}%</span>
              <span>RAM: {stats.memory}%</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="text" value={activeTab} onValueChange={(value) => setActiveTab(value as "text" | "voice")}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 pt-2">
            <TabsTrigger value="text" className="rounded-t-md data-[state=active]:bg-background">
              <Hash className="h-4 w-4 mr-1" />
              Text
            </TabsTrigger>
            <TabsTrigger value="voice" className="rounded-t-md data-[state=active]:bg-background">
              <Volume2 className="h-4 w-4 mr-1" />
              Voice
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-2">
                {channels
                  .filter((channel) => channel.type === "text")
                  .map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      className={`w-full justify-start px-2 py-1.5 text-sm ${
                        activeChannel === channel.id ? "bg-muted font-medium" : "font-normal"
                      }`}
                      onClick={() => handleJoinVoiceChannel(channel.id)}
                    >
                      <Hash className="h-4 w-4 mr-2 opacity-70" />
                      {channel.name}
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="voice" className="flex-1">
            <ScrollArea className="h-full">
              <div className="p-2">
                {channels
                  .filter((channel) => channel.type === "voice")
                  .map((channel) => (
                    <div key={channel.id} className="mb-1">
                      <Button
                        variant="ghost"
                        className={`w-full justify-start px-2 py-1.5 text-sm ${
                          activeChannel === channel.id && isConnected ? "bg-muted font-medium" : "font-normal"
                        }`}
                        onClick={() => handleJoinVoiceChannel(channel.id)}
                      >
                        <Volume2 className="h-4 w-4 mr-2 opacity-70" />
                        {channel.name}
                      </Button>

                      {activeChannel === channel.id && isConnected && (
                        <div className="ml-6 mt-1 space-y-1">
                          {voiceUsers.map((user) => (
                            <div key={user.id} className="flex items-center gap-2 px-2 py-1 rounded-md text-sm">
                              <div className="relative">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                                </Avatar>
                                {user.isSpeaking && (
                                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background"></span>
                                )}
                              </div>
                              <span className={user.isMuted ? "text-muted-foreground" : ""}>{user.name}</span>
                              {user.isMuted && <MicOff className="h-3 w-3 text-muted-foreground" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activeTab === "text" && activeChannel && (
          <>
            {/* Channel Header */}
            <div className="border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <Hash className="h-5 w-5 mr-2 text-muted-foreground" />
                <h3 className="font-medium">{channels.find((c) => c.id === activeChannel)?.name || "Kanal"}</h3>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Users className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mitglieder anzeigen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Kanaleinstellungen</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.user.avatar} />
                      <AvatarFallback>{message.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{message.user.name}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nachricht schreiben..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        )}

        {activeTab === "voice" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <Card className="w-full max-w-3xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Sprachkanal: {channels.find((c) => c.id === activeChannel)?.name}
              </h3>

              {isConnected ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Local User */}
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
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className={isMuted ? "text-red-500" : ""}
                          onClick={toggleMute}
                        >
                          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Remote Users */}
                    {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
                      <div key={userId} className="flex flex-col items-center p-4 border rounded-lg">
                        <div className="relative">
                          <Avatar className="h-20 w-20 mb-4">
                            <AvatarImage src={`/placeholder.svg?height=80&width=80&text=${userId.substring(0, 2)}`} />
                            <AvatarFallback>{userId.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          {activeSpeakers.has(userId) && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-background"></span>
                          )}
                          <audio
                            ref={(audio) => {
                              if (audio) {
                                audio.srcObject = stream
                                audio.autoplay = true
                              }
                            }}
                          />
                        </div>
                        <h4 className="font-medium mb-2">User {userId.substring(0, 6)}</h4>
                      </div>
                    ))}

                    {/* Placeholder for empty slots */}
                    {remoteStreams.size === 0 && (
                      <div className="flex flex-col items-center p-4 border rounded-lg border-dashed">
                        <div className="h-20 w-20 mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h4 className="font-medium mb-2 text-muted-foreground">Warte auf Teilnehmer...</h4>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="destructive" onClick={disconnect} className="gap-2">
                      <PhoneOff className="h-4 w-4" />
                      Kanal verlassen
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="mb-6 text-center">
                    <Volume2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="text-lg font-medium">Sprachkanal beitreten</h4>
                    <p className="text-muted-foreground mt-2">
                      Klicke auf den Button, um dem Sprachkanal beizutreten und mit anderen zu sprechen.
                    </p>
                  </div>

                  <Button onClick={() => connect(serverId!, activeChannel!)} disabled={isConnecting} className="gap-2">
                    {isConnecting ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Verbinde...
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Kanal beitreten
                      </>
                    )}
                  </Button>

                  {error && <p className="text-destructive text-sm mt-4">Fehler: {error}</p>}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

