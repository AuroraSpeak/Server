"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useWebRTC } from "./webrtc-context"

// Define types for our data structures
export type User = {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  status: "online" | "idle" | "dnd" | "offline"
  roleString?: string
  isMuted?: boolean
  isDeafened?: boolean
}

export type Message = {
  id: string
  channelId: string
  userId: string
  content: string
  timestamp: string
  createdAt: string
  user: User
  reactions?: Array<{ emoji: string; count: number }>
  isPinned?: boolean
  isThread?: boolean
  files?: Array<{ name: string; type: string; size: string; url: string }>
}

export type Channel = {
  id: string
  name: string
  type: "text" | "voice"
  serverId: string
  userLimit?: number
}

export type Server = {
  id: string
  name: string
  icon: string
  color?: string
  boostLevel?: number
}

type AppContextType = {
  servers: Server[]
  channels: Channel[]
  messages: Message[]
  members: User[]
  activeServer: string
  activeChannel: string
  setActiveServer: (serverId: string) => void
  setActiveChannel: (channelId: string) => void
  sendMessage: (content: string) => void
  joinVoiceChannel: (channelId: string) => void
  leaveVoiceChannel: () => void
  isInVoiceChannel: boolean
  activeVoiceChannel: string | null
  activeVoiceUsers: User[]
  isMuted: boolean
  isDeafened: boolean
  toggleMute: () => void
  toggleDeafen: () => void
  toggleMembersSidebar: () => void
  showMembersSidebar: boolean
  getAudioLevel: (userId: string) => number
  currentUser: User | null;
  createServer: (serverData: { name: string; icon: string; color?: string; }, csrfToken: string) => Promise<Server>
  createChannel: (channelData: { name: string; type: "text" | "voice"; userLimit?: number }, csrfToken: string) => Promise<Channel>
}

const AppContext = createContext<AppContextType | null>(null)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const webrtc = useWebRTC()

  // State for servers, channels, messages, etc.
  const [servers, setServers] = useState<Server[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [activeServer, setActiveServer] = useState<string>("")
  const [activeChannel, setActiveChannel] = useState<string>("")
  const [showMembersSidebar, setShowMembersSidebar] = useState<boolean>(true)

  // Voice chat state
  const [isInVoiceChannel, setIsInVoiceChannel] = useState<boolean>(false)
  const [activeVoiceChannel, setActiveVoiceChannel] = useState<string | null>(null)
  const [activeVoiceUsers, setActiveVoiceUsers] = useState<User[]>([])
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [isDeafened, setIsDeafened] = useState<boolean>(false)

  // Fetch servers
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const serverRes = await fetch("/api/servers", {
          credentials: "include",
        })
        if (!serverRes.ok) {
          throw new Error("Failed to fetch servers");
        }

        const data = await serverRes.json()
        setServers(data.servers)

        if(data.servers.length > 0 && !activeServer) {
          setActiveServer(data.servers[0].id)
        }
      } catch (error) {
        console.error("Error fetching servers:", error)
      }
    }

    if (user) {
      fetchServers()
    }
  }, [user, activeServer])

  // Fetch channels when active server changes
  useEffect(() => {
    const fetchChannels = async () => {
      if (!activeServer) return

      try {
        const serverRes = await fetch(`/api/servers/${activeServer}/channels`, {
          credentials: "include",
        })
        if (!serverRes.ok) {
          throw new Error("Failed to fetch channels");
        }
        const data = await serverRes.json()
        setChannels(data.channels)

        if (data.channels.length > 0 && (!activeChannel || !data.channels.find((c: Channel) => c.id === activeChannel))) {
          setActiveChannel(data.channels[0].id)
        }
      } catch (error) {
        console.error("Error fetching channels:", error)
        // Setze leere Kanäle bei Fehler
        setChannels([])
      }
    }

    fetchChannels()
  }, [activeServer, activeChannel])

  // Fetch messages when active channel changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChannel) return

      try {
        // Mock data - in a real app, this would be an API call
        
        /*
        TODO: Replace with real data
        const channelMessages = mockMessages.filter((message) => message.channelId === activeChannel)
        setMessages(channelMessages)
        */
      } catch (error) {
        console.error("Error fetching messages:", error)
      }
    }

    fetchMessages()
  }, [activeChannel])

  // Fetch members when active server changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeServer) return

      try {
        const memberRes = await fetch(`/api/servers/${activeServer}/members`, {
          credentials: "include",
        })
        if (!memberRes.ok) {
          throw new Error("Failed to fetch members");
        }
        const data = await memberRes.json()
        // Konvertiere die Mitglieder in den korrekten Typ
        const typedMembers: User[] = data.members.map((member: any) => ({
          ...member,
          status: member.status as "online" | "idle" | "dnd" | "offline"
        }))
        setMembers(typedMembers)
      } catch (error) {
        console.error("Error fetching members:", error)
        setMembers([])
      }
    }

    fetchMembers()
  }, [activeServer])

  // Function to send a message
  const sendMessage = (content: string) => {
    if (!activeChannel || !user) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channelId: activeChannel,
      userId: user.id,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        status: "online",
        avatarUrl: user.avatarUrl,
      },
    }

    setMessages((prev) => [...prev, newMessage])

    // Simulate a response after a short delay
    setTimeout(
      () => {
        const responseUser = members[Math.floor(Math.random() * members.length)]
        const responses = [
          "Thanks for sharing!",
          "That's interesting. Can you tell me more?",
          "I agree with your point.",
          "Let's discuss this further in our next meeting.",
          "Great idea! I'll make a note of that.",
          "I'll look into this and get back to you.",
          "👍 Sounds good!",
          "I have some thoughts on this. Let me organize them and I'll share later today.",
        ]

        const responseMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          channelId: activeChannel,
          userId: responseUser.id,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: new Date().toISOString(),
          user: responseUser,
        }

        setMessages((prev) => [...prev, responseMessage])
      },
      2000 + Math.random() * 3000,
    ) // Random delay between 2-5 seconds
  }

  // Voice chat functions
  const joinVoiceChannel = (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId)
    if (!channel || channel.type !== "voice") return

    setIsInVoiceChannel(true)
    setActiveVoiceChannel(channelId)
    setActiveChannel(channelId)

    // Get all members for this voice channel (in a real app, you'd get actual participants)
    const voiceUsers = [
      ...(user
        ? [
            {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              status: "online",
              avatarUrl: user.avatarUrl,
            },
          ]
        : []),
      ...members.filter((m) => m.id !== user?.id).slice(0, 3), // Take first 3 other members
    ]

    setActiveVoiceUsers(voiceUsers)

    // Initialize WebRTC connections
    webrtc.joinVoiceChannel(channelId, voiceUsers)
  }

  const leaveVoiceChannel = () => {
    setIsInVoiceChannel(false)
    setActiveVoiceChannel(null)
    setActiveVoiceUsers([])

    // Close WebRTC connections
    webrtc.leaveVoiceChannel()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    webrtc.toggleMicrophone()
  }

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened)
    // In a real implementation, this would mute all incoming audio
  }

  const toggleMembersSidebar = () => {
    setShowMembersSidebar(!showMembersSidebar)
  }

  // Get audio level for a user
  const getAudioLevel = (userId: string): number => {
    return webrtc.getAudioLevel(userId)
  }

  const currentUser: User = user as User;

  const createServer = async (
    serverData: {
      name: string
      icon: string
      color?: string
      type?: string
    },
    csrfToken: string
  ): Promise<Server> => {
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(serverData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create server")
      }

      const server = await res.json()
      setServers((prev) => [...prev, server])
      return server
    } catch (error) {
      console.error("Error creating server:", error)
      throw error
    }
  }

  const createChannel = async (
    channelData: { name: string; type: "text" | "voice"; userLimit?: number },
    csrfToken: string
  ): Promise<Channel> => {
    if (!activeServer) {
      throw new Error("No active server selected");
    }
  
    const res = await fetch(`/api/servers/${activeServer}/channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken || "",
      },
      body: JSON.stringify(channelData),
      credentials: "include",
    });
  
    if (!res.ok) {
      const message = await res.text();
      throw new Error(`Failed to create channel: ${message}`);
    }
  
    const createdChannel: Channel = await res.json();
  
    // Optionally: Update state
    setChannels((prev) => [...prev, createdChannel]);
  
    return createdChannel;
  };
 
  // Provide the context value
  const contextValue: AppContextType = {
    servers,
    channels,
    messages,
    members,
    activeServer,
    activeChannel,
    setActiveServer,
    setActiveChannel,
    sendMessage,
    joinVoiceChannel,
    leaveVoiceChannel,
    isInVoiceChannel,
    activeVoiceChannel,
    activeVoiceUsers,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    toggleMembersSidebar,
    showMembersSidebar,
    getAudioLevel,
    currentUser,
    createServer,
    createChannel
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

