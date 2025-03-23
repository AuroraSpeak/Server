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
        // In a real app, this would be an API call
        const mockServers: Server[] = [
          { id: "server-1", name: "Gaming Hub", icon: "G" },
          { id: "server-2", name: "Dev Team", icon: "D" },
          { id: "server-3", name: "Movie Club", icon: "M" },
        ]

        setServers(mockServers)

        if (mockServers.length > 0 && !activeServer) {
          setActiveServer(mockServers[0].id)
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
        // Mock data - in a real app, this would be an API call
        const mockChannels: Channel[] = [
          { id: "channel-1", name: "general", type: "text", serverId: "server-1" },
          { id: "channel-2", name: "gaming-news", type: "text", serverId: "server-1" },
          { id: "channel-3", name: "memes", type: "text", serverId: "server-1" },
          { id: "channel-4", name: "General Voice", type: "voice", serverId: "server-1" },
          { id: "channel-5", name: "Gaming Voice", type: "voice", serverId: "server-1" },

          { id: "channel-6", name: "general", type: "text", serverId: "server-2" },
          { id: "channel-7", name: "dev-chat", type: "text", serverId: "server-2" },
          { id: "channel-8", name: "Dev Voice", type: "voice", serverId: "server-2" },

          { id: "channel-9", name: "general", type: "text", serverId: "server-3" },
          { id: "channel-10", name: "movie-recs", type: "text", serverId: "server-3" },
          { id: "channel-11", name: "Movie Night", type: "voice", serverId: "server-3" },
        ]

        const serverChannels = mockChannels.filter((channel) => channel.serverId === activeServer)
        setChannels(serverChannels)

        if (serverChannels.length > 0 && (!activeChannel || !serverChannels.find((c) => c.id === activeChannel))) {
          setActiveChannel(serverChannels[0].id)
        }
      } catch (error) {
        console.error("Error fetching channels:", error)
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
        const mockMessages: Message[] = [
          {
            id: "msg-1",
            channelId: "channel-1",
            userId: "user-1",
            content: "Hey everyone! Welcome to the server!",
            timestamp: "14:35",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-1",
              fullName: "Server Admin",
              email: "admin@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
          {
            id: "msg-2",
            channelId: "channel-1",
            userId: "user-2",
            content: "Thanks for the invite! Looking forward to gaming with you all.",
            timestamp: "13:38",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-2",
              fullName: "GamerX",
              email: "gamerx@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
          {
            id: "msg-3",
            channelId: "channel-1",
            userId: "user-2",
            content: "I've been playing a lot of Valorant lately.",
            timestamp: "13:38",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-2",
              fullName: "GamerX",
              email: "gamerx@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
          {
            id: "msg-4",
            channelId: "channel-1",
            userId: "user-3",
            content: "What games is everyone playing these days?",
            timestamp: "14:06",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-3",
              fullName: "FragMaster",
              email: "frag@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
          // Channel 2 messages
          {
            id: "msg-5",
            channelId: "channel-2",
            userId: "user-1",
            content: "Did you hear about the new Cyberpunk 2077 update?",
            timestamp: "10:15",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-1",
              fullName: "Server Admin",
              email: "admin@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
          {
            id: "msg-6",
            channelId: "channel-2",
            userId: "user-3",
            content: "Yeah, it looks amazing! Can't wait to try it out.",
            timestamp: "10:18",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-3",
              fullName: "FragMaster",
              email: "frag@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
          // Channel 3 messages
          {
            id: "msg-7",
            channelId: "channel-3",
            userId: "user-2",
            content: "Check out this hilarious gaming meme!",
            timestamp: "09:45",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-2",
              fullName: "GamerX",
              email: "gamerx@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
            files: [
              {
                name: "gaming-meme.jpg",
                type: "image",
                size: "1.2 MB",
                url: "/placeholder.svg?height=300&width=400",
              },
            ],
          },
          // Channel 6 messages (server 2)
          {
            id: "msg-8",
            channelId: "channel-6",
            userId: "user-1",
            content: "Welcome to the Dev Team server!",
            timestamp: "11:30",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-1",
              fullName: "Server Admin",
              email: "admin@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
          // Channel 9 messages (server 3)
          {
            id: "msg-9",
            channelId: "channel-9",
            userId: "user-1",
            content: "Welcome to the Movie Club server!",
            timestamp: "12:00",
            createdAt: new Date().toISOString(),
            user: {
              id: "user-1",
              fullName: "Server Admin",
              email: "admin@example.com",
              status: "online",
              avatarUrl: "/placeholder.svg?height=40&width=40",
            },
          },
        ]

        const channelMessages = mockMessages.filter((message) => message.channelId === activeChannel)
        setMessages(channelMessages)
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
        // Mock data - in a real app, this would be an API call
        const mockMembers: User[] = [
          {
            id: "user-1",
            fullName: "Server Admin",
            email: "admin@example.com",
            status: "online",
            avatarUrl: "/placeholder.svg?height=40&width=40",
            roleString: "Admin,Moderator",
          },
          {
            id: "user-2",
            fullName: "GamerX",
            email: "gamerx@example.com",
            status: "online",
            avatarUrl: "/placeholder.svg?height=40&width=40",
            roleString: "Member",
          },
          {
            id: "user-3",
            fullName: "FragMaster",
            email: "frag@example.com",
            status: "online",
            avatarUrl: "/placeholder.svg?height=40&width=40",
            roleString: "Moderator",
          },
          {
            id: "user-4",
            fullName: "Project Lead",
            email: "lead@example.com",
            status: "online",
            avatarUrl: "/placeholder.svg?height=40&width=40",
            roleString: "Member",
          },
          {
            id: "user-5",
            fullName: "MovieBuff",
            email: "movie@example.com",
            status: "online",
            avatarUrl: "/placeholder.svg?height=40&width=40",
            roleString: "Member",
          },
          {
            id: "user-6",
            fullName: "CodeNinja",
            email: "code@example.com",
            status: "offline",
            avatarUrl: "/placeholder.svg?height=40&width=40",
            roleString: "Member",
          },
          {
            id: "user-7",
            fullName: "DesignGuru",
            email: "design@example.com",
            status: "offline",
            avatarUrl: "/placeholder.svg?height=40&width=40",
            roleString: "Member",
          },
        ]

        setMembers(mockMembers)
      } catch (error) {
        console.error("Error fetching members:", error)
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
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

