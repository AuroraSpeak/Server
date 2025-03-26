"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { AppProvider, useAppContext } from "@/contexts/app-context"
import { WebRTCProvider } from "@/contexts/webrtc-context"
import AuraServerSidebar from "@/components/aura-server-sidebar"
import AuraChannelSidebar from "@/components/aura-channel-sidebar"
import AuraChat from "@/components/aura-chat"
import AuraMembersSidebar from "@/components/aura-members-sidebar"
import VoiceChat from "@/components/voice-chat"

// Main app component that uses the context
function AppContent() {
  const {
    servers,
    channels,
    messages,
    members,
    activeServer,
    activeChannel,
    setActiveServer,
    setActiveChannel,
    sendMessage,
    isInVoiceChannel,
    activeVoiceChannel,
    activeVoiceUsers,
    toggleMembersSidebar,
    showMembersSidebar,
  } = useAppContext()

  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.add("dark")

    // Prevent scroll on body
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[hsl(var(--aura-bg))]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[hsl(var(--aura-primary))] border-solid"></div>
          <p className="text-[hsl(var(--aura-text-muted))]">Loading AuraSpeak...</p>
        </div>
      </div>
    )
  }

  // Get active server name
  const activeServerName = servers.find((server) => server.id === activeServer)?.name || "Home"

  // Get active channel name and type
  const activeChannelObj = channels.find((channel) => channel.id === activeChannel)
  const activeChannelName = activeChannelObj?.name || ""
  const isVoiceChannel = activeChannelObj?.type === "voice"

  return (
    <div className="app-container">
      <AuraServerSidebar servers={servers} activeServer={activeServer} setActiveServer={setActiveServer} />

      <AuraChannelSidebar
        channels={channels}
        activeChannel={activeChannel}
        setActiveChannel={setActiveChannel}
        serverName={activeServerName}
        currentUser={user}
        activeServer={activeServer}
      />

      {isVoiceChannel && isInVoiceChannel ? (
        <VoiceChat channelName={activeChannelName} participants={activeVoiceUsers} />
      ) : (
        <AuraChat
          activeChannel={activeChannel}
          channelName={activeChannelName}
          messages={messages}
          currentUser={user}
          onSendMessage={sendMessage}
          toggleMembersSidebar={toggleMembersSidebar}
        />
      )}

      {showMembersSidebar && <AuraMembersSidebar members={members} />}
    </div>
  )
}

// Wrapper component that provides the context
export default function Home() {
  return (
    <WebRTCProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </WebRTCProvider>
  )
}

