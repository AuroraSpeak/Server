"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  PlusCircle,
  Gift,
  Sticker,
  Smile,
  AtSign,
  Hash,
  Bell,
  Pin,
  Users,
  HandHelpingIcon as Help,
  Inbox,
  Volume2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface DiscordChatProps {
  activeChannel: string
  channelName: string
  messages: any[]
  currentUser: any
  onSendMessage: (content: string) => void
}

export default function DiscordChat({
  activeChannel,
  channelName,
  messages,
  currentUser,
  onSendMessage,
}: DiscordChatProps) {
  const [messageText, setMessageText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageText.trim()) return
    onSendMessage(messageText)
    setMessageText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Group messages by user and date
  const groupedMessages: { [key: string]: any[] } = {}
  messages.forEach((message) => {
    const key = `${message.userId}-${new Date(message.createdAt).toLocaleDateString()}`
    if (!groupedMessages[key]) {
      groupedMessages[key] = []
    }
    groupedMessages[key].push(message)
  })

  const isVoiceChannel = channelName.includes("Voice")

  return (
    <div className="discord-chat flex flex-col h-full">
      {/* Channel header */}
      <div className="h-12 border-b border-discord-bg flex items-center px-4">
        <div className="flex items-center">
          {!isVoiceChannel ? (
            <Hash size={24} className="mr-2 text-discord-text-muted" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-discord-muted flex items-center justify-center mr-2">
              <Volume2 size={14} className="text-discord-text-muted" />
            </div>
          )}
          <h2 className="font-bold">{channelName}</h2>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {!isVoiceChannel && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
                <Bell size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
                <Pin size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
                <Users size={20} />
              </Button>
            </>
          )}
          <div className="relative">
            <Input placeholder="Search" className="h-6 w-36 bg-discord-bg text-sm py-1 px-2" />
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
            <Inbox size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
            <Help size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              {!isVoiceChannel ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-discord-muted flex items-center justify-center mb-4">
                    <Hash size={32} className="text-discord-interactive" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Welcome to #{channelName}!</h3>
                  <p className="text-discord-text-muted text-center max-w-md">
                    This is the start of the #{channelName} channel. Send a message to start the conversation.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-discord-muted flex items-center justify-center mb-4">
                    <Volume2 size={32} className="text-discord-interactive" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Voice Channel: {channelName}</h3>
                  <p className="text-discord-text-muted text-center max-w-md">
                    Join this voice channel to chat with other members.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Message groups */}
          {Object.values(groupedMessages).map((group, groupIndex) => (
            <div key={groupIndex} className="message-group">
              {group.map((message, messageIndex) => {
                const isFirstInGroup = messageIndex === 0
                const user = message.user || { fullName: "Unknown User", avatarUrl: null }
                const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <div key={message.id} className={cn("flex", isFirstInGroup ? "mt-4" : "mt-0.5")}>
                    {isFirstInGroup ? (
                      <Avatar className="h-10 w-10 mt-0.5 mr-4">
                        <AvatarImage src={user.avatarUrl || "/placeholder.svg?height=40&width=40"} />
                        <AvatarFallback>{user.fullName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 mr-4"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isFirstInGroup && (
                        <div className="flex items-center">
                          <span className="font-medium hover:underline cursor-pointer">{user.fullName}</span>
                          <span className="text-xs text-discord-text-muted ml-2">{timestamp}</span>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      {!isVoiceChannel && (
        <div className="px-4 pb-6 pt-2">
          <div className="relative rounded-lg bg-discord-muted">
            <Button variant="ghost" size="icon" className="absolute left-2 top-2 text-discord-interactive">
              <PlusCircle size={20} />
            </Button>
            <Input
              placeholder={`Message #${channelName}`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-20 py-3 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
                <Gift size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
                <Sticker size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
                <Smile size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-discord-interactive">
                <AtSign size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

