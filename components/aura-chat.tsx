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
  Phone,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAppContext } from "@/contexts/app-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AuraChatProps {
  activeChannel: string
  channelName: string
  messages: any[]
  currentUser: any
  onSendMessage: (content: string) => void
  toggleMembersSidebar: () => void
}

export default function AuraChat({
  activeChannel,
  channelName,
  messages,
  currentUser,
  onSendMessage,
  toggleMembersSidebar,
}: AuraChatProps) {
  const [messageText, setMessageText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { joinVoiceChannel } = useAppContext()

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

  const handleJoinVoiceChannel = () => {
    // Find a voice channel in the same server
    const channel = activeChannel.replace("general", "General Voice")
    joinVoiceChannel(channel)
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

  // Simulate typing indicator
  useEffect(() => {
    const randomInterval = Math.floor(Math.random() * 10000) + 5000 // 5-15 seconds
    const typingTimer = setInterval(() => {
      if (Math.random() > 0.7) {
        // 30% chance to show typing
        setIsTyping(true)
        setTimeout(() => setIsTyping(false), 3000)
      }
    }, randomInterval)

    return () => clearInterval(typingTimer)
  }, [])

  return (
    <div className="aura-chat flex flex-col h-full">
      {/* Channel header */}
      <div className="h-12 border-b border-aura-bg flex items-center px-4">
        <div className="flex items-center">
          {!isVoiceChannel ? (
            <Hash size={24} className="mr-2 text-aura-text-muted" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-aura-muted flex items-center justify-center mr-2">
              <Volume2 size={14} className="text-aura-text-muted" />
            </div>
          )}
          <h2 className="font-bold">{channelName}</h2>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {!isVoiceChannel && (
            <>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
                <Bell size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
                <Pin size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-aura-interactive"
                onClick={toggleMembersSidebar}
              >
                <Users size={20} />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                      onClick={handleJoinVoiceChannel}
                    >
                      <Phone size={14} className="mr-1" />
                      Voice
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Join Voice Channel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          <div className="relative">
            <Input placeholder="Search" className="h-6 w-36 bg-aura-bg text-sm py-1 px-2" />
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
            <Inbox size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
            <Help size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 scrollable">
        <div className="space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              {!isVoiceChannel ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-aura-muted flex items-center justify-center mb-4">
                    <Hash size={32} className="text-aura-interactive" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Welcome to #{channelName}!</h3>
                  <p className="text-aura-text-muted text-center max-w-md">
                    This is the start of the #{channelName} channel. Send a message to start the conversation.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-aura-muted flex items-center justify-center mb-4">
                    <Volume2 size={32} className="text-aura-interactive" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Voice Channel: {channelName}</h3>
                  <p className="text-aura-text-muted text-center max-w-md">
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
                  <div key={message.id} className={cn("flex message", isFirstInGroup ? "mt-4" : "mt-0.5")}>
                    {isFirstInGroup ? (
                      <div className="avatar-with-status mr-4">
                        <Avatar className="h-10 w-10 mt-0.5">
                          <AvatarImage src={user.avatarUrl || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback>{user.fullName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <div className="w-10 mr-4"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isFirstInGroup && (
                        <div className="flex items-center">
                          <span className="font-medium hover:underline cursor-pointer">{user.fullName}</span>
                          <span className="text-xs text-aura-text-muted ml-2">{timestamp}</span>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                      {/* Display files if any */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.files.map((file: any, index: number) => (
                            <div key={index} className="max-w-sm">
                              {file.type === "image" ? (
                                <img
                                  src={file.url || "/placeholder.svg"}
                                  alt={file.name}
                                  className="rounded-md border border-aura-muted max-h-60 object-cover"
                                />
                              ) : (
                                <div className="flex items-center p-2 bg-aura-muted rounded-md">
                                  <div className="mr-2 text-aura-text-muted">
                                    <File size={16} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate font-medium text-sm">{file.name}</p>
                                    <p className="text-xs text-aura-text-muted">{file.size}</p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-aura-interactive">
                                    Download
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Display reactions if any */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex mt-2 space-x-2">
                          {message.reactions.map((reaction: any, index: number) => (
                            <button
                              key={index}
                              className="flex items-center bg-aura-muted hover:bg-aura-muted/80 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors"
                            >
                              <span className="mr-1">{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center text-sm text-aura-text-muted">
              <div className="flex space-x-1 mr-2">
                <div
                  className="w-2 h-2 rounded-full bg-aura-text-muted animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-aura-text-muted animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-aura-text-muted animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
              <span>Someone is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      {!isVoiceChannel && (
        <div className="message-input-container">
          <div className="relative rounded-lg bg-aura-muted">
            <Button variant="ghost" size="icon" className="absolute left-2 top-2 text-aura-interactive">
              <PlusCircle size={20} />
            </Button>
            <Input
              placeholder={`Message #${channelName}`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-20 py-3 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 message-input"
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
                <Gift size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
                <Sticker size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
                <Smile size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-aura-interactive">
                <AtSign size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for file icon
function File(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

