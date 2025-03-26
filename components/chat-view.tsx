"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Paperclip,
  Smile,
  AtSign,
  Phone,
  Video,
  Info,
  MoreHorizontal,
  Reply,
  Bookmark,
  Edit,
  Trash2,
  Forward,
  ImageIcon,
  FileText,
  Mic,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { spaces, messages as allMessages, participants } from "@/lib/data"

interface ChatViewProps {
  activeSpace: string
  activeChannel: string
}

export default function ChatView({ activeSpace, activeChannel }: ChatViewProps) {
  const [messageText, setMessageText] = useState("")
  const [showParticipants, setShowParticipants] = useState(true)
  const [messages, setMessages] = useState(allMessages.filter((m) => m.channelId === activeChannel))
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Update messages when channel changes
  useEffect(() => {
    setMessages(allMessages.filter((m) => m.channelId === activeChannel))
  }, [activeChannel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage = {
        id: Date.now(),
        channelId: activeChannel,
        user: {
          name: "You",
          avatar: "/placeholder.svg?height=40&width=40",
          status: "online",
        },
        content: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        reactions: [],
        isPinned: false,
        isThread: false,
        files: [],
      }

      setMessages((prev) => [...prev, newMessage])
      setMessageText("")

      // Simulate someone typing back
      setIsTyping(true)
      const typingTimeout = Math.random() * 3000 + 1000 // Random time between 1-4 seconds

      setTimeout(() => {
        setIsTyping(false)

        const responseMessage = {
          id: Date.now() + 1,
          channelId: activeChannel,
          user: participants[Math.floor(Math.random() * participants.length)],
          content: getRandomResponse(),
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          reactions: [],
          isPinned: false,
          isThread: false,
          files: [],
        }

        setMessages((prev) => [...prev, responseMessage])
      }, typingTimeout)
    }
  }

  const getRandomResponse = () => {
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
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getSpaceName = () => {
    const space = spaces.find((s) => s.id === activeSpace)
    return space ? space.name : ""
  }

  const getChannelName = () => {
    const space = spaces.find((s) => s.id === activeSpace)
    if (!space) return ""
    const channel = space.channels.find((c) => c.id === activeChannel)
    return channel ? channel.name : ""
  }

  const getChannelType = () => {
    const space = spaces.find((s) => s.id === activeSpace)
    if (!space) return "chat"
    const channel = space.channels.find((c) => c.id === activeChannel)
    return channel ? channel.type : "chat"
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={16} />
      case "document":
        return <FileText size={16} />
      default:
        return <FileText size={16} />
    }
  }

  const handleReaction = (messageId: number, emoji: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === messageId) {
          const existingReaction = message.reactions.find((r) => r.emoji === emoji)

          if (existingReaction) {
            // Increment count if reaction exists
            return {
              ...message,
              reactions: message.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r)),
            }
          } else {
            // Add new reaction
            return {
              ...message,
              reactions: [...message.reactions, { emoji, count: 1 }],
            }
          }
        }
        return message
      }),
    )
  }

  const togglePinMessage = (messageId: number) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === messageId) {
          return { ...message, isPinned: !message.isPinned }
        }
        return message
      }),
    )
  }

  const deleteMessage = (messageId: number) => {
    setMessages((prev) => prev.filter((message) => message.id !== messageId))
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      {/* Channel header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center">
          <h2 className="font-medium">{getChannelName()}</h2>
          <span className="mx-2 text-slate-300">•</span>
          <span className="text-sm text-slate-500">{getSpaceName()}</span>
        </div>

        <div className="flex items-center space-x-2">
          {getChannelType() === "voice" && (
            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <Phone size={16} className="mr-1" />
              Join Call
            </Button>
          )}

          {getChannelType() === "video" && (
            <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
              <Video size={16} className="mr-1" />
              Join Meeting
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Info size={20} />
          </Button>
        </div>
      </div>

      {/* Main chat area with optional sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {/* Pinned messages */}
          {messages.some((m) => m.isPinned) && (
            <div className="bg-amber-50 p-3 border-b border-amber-100">
              <div className="flex items-center text-sm text-amber-700 mb-2">
                <Bookmark size={16} className="mr-2" />
                <span className="font-medium">Pinned Message</span>
              </div>
              {messages
                .filter((m) => m.isPinned)
                .map((message) => (
                  <div key={`pinned-${message.id}`} className="flex items-start">
                    <p className="text-sm text-slate-600">{message.content}</p>
                  </div>
                ))}
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-full">
            <div className="space-y-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MessageIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-700 mb-2">No messages yet</h3>
                  <p className="text-sm text-slate-500 max-w-md">
                    Be the first to start a conversation in this channel!
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="group animate-fade-in">
                    <div className="flex">
                      <div className="relative mr-3 mt-0.5">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={message.user.avatar} />
                          <AvatarFallback>
                            {message.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            message.user.status === "online"
                              ? "bg-emerald-500"
                              : message.user.status === "away"
                                ? "bg-amber-500"
                                : "bg-slate-300"
                          }`}
                        ></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline">
                          <span className="font-medium mr-2">{message.user.name}</span>
                          <span className="text-xs text-slate-400">{message.timestamp}</span>
                        </div>

                        <div className="mt-1">
                          <p className="text-slate-700">{message.content}</p>

                          {/* Files */}
                          {message.files.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.files.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                >
                                  <div className="mr-2 text-slate-400">{getFileIcon(file.type)}</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate font-medium">{file.name}</p>
                                    <p className="text-xs text-slate-400">{file.size}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                  >
                                    <Paperclip size={16} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Reactions */}
                          {message.reactions.length > 0 && (
                            <div className="flex mt-2 space-x-2">
                              {message.reactions.map((reaction, index) => (
                                <button
                                  key={index}
                                  className="flex items-center bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-full text-xs transition-colors"
                                  onClick={() => handleReaction(message.id, reaction.emoji)}
                                >
                                  <span className="mr-1">{reaction.emoji}</span>
                                  <span>{reaction.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start space-x-1 ml-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-700"
                              >
                                <Reply size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reply</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                onClick={() => handleReaction(message.id, "👍")}
                              >
                                <Smile size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add Reaction</p>
                            </TooltipContent>
                          </Tooltip>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-slate-700"
                              >
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => togglePinMessage(message.id)}>
                                <Bookmark size={16} className="mr-2" />
                                <span>{message.isPinned ? "Unpin Message" : "Pin Message"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit size={16} className="mr-2" />
                                <span>Edit Message</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Forward size={16} className="mr-2" />
                                <span>Forward</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={() => deleteMessage(message.id)}
                              >
                                <Trash2 size={16} className="mr-2" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex items-center text-sm text-slate-500">
                  <div className="flex space-x-1 mr-2">
                    <div
                      className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
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
          <div className="p-4 border-t">
            <Card className="overflow-hidden">
              <div className="relative">
                <Input
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-6 rounded-none"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                          <AtSign size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mention</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                          <Paperclip size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Attach File</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                          <Smile size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Emoji</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-700"
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                        >
                          <Send size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="bg-slate-50 p-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-700">
                    <ImageIcon size={16} className="mr-1" />
                    <span>Image</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-700">
                    <FileText size={16} className="mr-1" />
                    <span>File</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-slate-500 hover:text-slate-700">
                    <Mic size={16} className="mr-1" />
                    <span>Voice</span>
                  </Button>
                </div>

                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <Send size={16} className="mr-1" />
                  <span>Send</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="w-64 border-l bg-slate-50 hidden md:block">
            <Tabs defaultValue="participants">
              <div className="p-3 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="participants">People</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="participants" className="m-0">
                <div className="p-3">
                  <h3 className="text-sm font-medium text-slate-500 mb-3">PARTICIPANTS ({participants.length})</h3>

                  <div className="space-y-2">
                    {participants.map((user) => (
                      <div key={user.id} className="flex items-center p-2 hover:bg-white rounded-md transition-colors">
                        <div className="relative mr-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-50 ${
                              user.status === "online"
                                ? "bg-emerald-500"
                                : user.status === "away"
                                  ? "bg-amber-500"
                                  : "bg-slate-300"
                            }`}
                          ></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="m-0">
                <div className="p-3">
                  <h3 className="text-sm font-medium text-slate-500 mb-3">SHARED FILES</h3>

                  <div className="space-y-2">
                    {messages
                      .flatMap((m) => m.files)
                      .map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center p-2 bg-white border border-slate-200 rounded-lg text-sm hover:border-slate-300 transition-colors"
                        >
                          <div className="mr-2 text-slate-400">{getFileIcon(file.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{file.name}</p>
                            <p className="text-xs text-slate-400">{file.size}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                            <Paperclip size={14} />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

// Message icon for empty state
function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

