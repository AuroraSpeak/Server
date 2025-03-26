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
  Search,
  ArrowRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAppContext } from "@/contexts/app-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card"

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
      <div className="h-14 border-b border-[hsla(var(--aura-primary),0.1)] flex items-center px-4">
        <div className="flex items-center">
          {!isVoiceChannel ? (
            <Hash size={20} className="mr-2 text-[hsl(var(--aura-text-muted))]" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[hsl(var(--aura-muted))] flex items-center justify-center mr-2">
              <Volume2 size={14} className="text-[hsl(var(--aura-text-muted))]" />
            </div>
          )}
          <h2 className="font-medium">{channelName}</h2>
        </div>

        <div className="ml-auto flex items-center space-x-3">
          {!isVoiceChannel && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--aura-interactive))]">
                <Bell size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--aura-interactive))]">
                <Pin size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[hsl(var(--aura-interactive))]"
                onClick={toggleMembersSidebar}
              >
                <Users size={18} />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[hsl(var(--aura-success))] border-[hsla(var(--aura-success),0.3)] hover:bg-[hsla(var(--aura-success),0.1)]"
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
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--aura-text-muted))]" />
            <Input
              placeholder="Search"
              className="h-8 w-36 pl-8 bg-[hsl(var(--aura-channels))] border-[hsla(var(--aura-primary),0.1)] text-sm py-1"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--aura-interactive))]">
            <Inbox size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--aura-interactive))]">
            <Help size={18} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 scrollable">
        {/* Welcome message */}
        {messages.length === 0 && (
          <Card className="p-8 bg-[hsla(var(--aura-bg),0.5)] border-[hsla(var(--aura-primary),0.1)] flex flex-col items-center justify-center text-center">
            {!isVoiceChannel ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[hsla(var(--aura-primary),0.2)] flex items-center justify-center mb-4">
                  <Hash size={32} className="text-[hsl(var(--aura-primary))]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Welcome to #{channelName}!</h3>
                <p className="text-[hsl(var(--aura-text-muted))] max-w-md">
                  This is the start of the #{channelName} channel. Send a message to start the conversation.
                </p>
                <Button
                  className="mt-4 bg-[hsl(var(--aura-primary))] hover:bg-[hsla(var(--aura-primary),0.9)]"
                  onClick={() => {
                    const input = document.querySelector(
                      'input[placeholder="Message #' + channelName + '"]',
                    ) as HTMLInputElement
                    if (input) input.focus()
                  }}
                >
                  Start Chatting <ArrowRight size={16} className="ml-2" />
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-[hsla(var(--aura-primary),0.2)] flex items-center justify-center mb-4">
                  <Volume2 size={32} className="text-[hsl(var(--aura-primary))]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Voice Channel: {channelName}</h3>
                <p className="text-[hsl(var(--aura-text-muted))] max-w-md">
                  Join this voice channel to chat with other members.
                </p>
                <Button
                  className="mt-4 bg-[hsl(var(--aura-success))] hover:bg-[hsla(var(--aura-success),0.9)]"
                  onClick={handleJoinVoiceChannel}
                >
                  Join Voice Channel <Phone size={16} className="ml-2" />
                </Button>
              </>
            )}
          </Card>
        )}

        {/* Message groups */}
        <div className="space-y-6">
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
                  <div
                    key={message.id}
                    className={cn("flex message transition-colors rounded-md", isFirstInGroup ? "mt-4" : "mt-0.5")}
                  >
                    {isFirstInGroup ? (
                      <div className="avatar-with-status mr-4">
                        <Avatar className="h-10 w-10 mt-0.5">
                          <AvatarImage src={user.avatarUrl || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback className="bg-[hsla(var(--aura-primary),0.2)] text-white">
                            {user.fullName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="status-indicator status-online"></div>
                      </div>
                    ) : (
                      <div className="w-10 mr-4"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isFirstInGroup && (
                        <div className="flex items-center">
                          <span className="font-medium hover:underline cursor-pointer text-[hsl(var(--aura-text-normal))]">
                            {user.fullName}
                          </span>
                          <span className="text-xs text-[hsl(var(--aura-text-muted))] ml-2">{timestamp}</span>
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
                                  className="rounded-md border border-[hsla(var(--aura-primary),0.1)] max-h-60 object-cover"
                                />
                              ) : (
                                <div className="flex items-center p-2 bg-[hsla(var(--aura-muted),0.5)] rounded-md">
                                  <div className="mr-2 text-[hsl(var(--aura-text-muted))]">
                                    <File size={16} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate font-medium text-sm">{file.name}</p>
                                    <p className="text-xs text-[hsl(var(--aura-text-muted))]">{file.size}</p>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-[hsl(var(--aura-interactive))]">
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
                              className="flex items-center bg-[hsla(var(--aura-muted),0.5)] hover:bg-[hsla(var(--aura-muted),0.8)] px-2 py-1 rounded-full text-xs cursor-pointer transition-colors"
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
            <div className="flex items-center text-sm text-[hsl(var(--aura-text-muted))]">
              <div className="flex space-x-1 mr-2">
                <div
                  className="w-2 h-2 rounded-full bg-[hsl(var(--aura-text-muted))] animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-[hsl(var(--aura-text-muted))] animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-[hsl(var(--aura-text-muted))] animate-bounce"
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
        <div className="p-4 border-t border-[hsla(var(--aura-primary),0.1)] bg-[hsla(var(--aura-bg),0.7)] backdrop-blur-sm">
          <div className="message-input-container p-0">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-[hsl(var(--aura-interactive))] hover:text-[hsl(var(--aura-interactive-hover))] hover:bg-transparent"
              >
                <PlusCircle size={20} />
              </Button>
              <Input
                placeholder={`Message #${channelName}`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-24 py-3 bg-[hsla(var(--aura-channels),0.8)] border-[hsla(var(--aura-primary),0.2)] focus-visible:ring-[hsla(var(--aura-primary),0.4)] focus-visible:border-[hsl(var(--aura-primary))]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[hsl(var(--aura-interactive))] hover:text-[hsl(var(--aura-interactive-hover))] hover:bg-transparent"
                >
                  <Gift size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[hsl(var(--aura-interactive))] hover:text-[hsl(var(--aura-interactive-hover))] hover:bg-transparent"
                >
                  <Sticker size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[hsl(var(--aura-interactive))] hover:text-[hsl(var(--aura-interactive-hover))] hover:bg-transparent"
                >
                  <Smile size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[hsl(var(--aura-interactive))] hover:text-[hsl(var(--aura-interactive-hover))] hover:bg-transparent"
                >
                  <AtSign size={18} />
                </Button>
              </div>
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

