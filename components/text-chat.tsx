"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Smile, AtSign, Mic, ImageIcon, Code, PlusCircle, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const messages = [
  {
    id: 1,
    user: {
      name: "Alex",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "text-theme-purple",
    },
    content: "Hey everyone! Just wanted to check in. How's the project coming along?",
    timestamp: "Today at 10:30 AM",
    reactions: [{ emoji: "👍", count: 3 }],
    isPinned: false,
    isThread: false,
  },
  {
    id: 2,
    user: {
      name: "Taylor",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "text-theme-teal",
    },
    content: "Making good progress! I've finished the design mockups and will share them later today.",
    timestamp: "Today at 10:32 AM",
    reactions: [],
    isPinned: false,
    isThread: false,
  },
  {
    id: 3,
    user: {
      name: "Jordan",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "text-theme-amber",
    },
    content:
      "Great! I've been working on the backend API. @Alex can we schedule a quick call to discuss the integration?",
    timestamp: "Today at 10:35 AM",
    reactions: [{ emoji: "✅", count: 1 }],
    isPinned: false,
    isThread: false,
  },
  {
    id: 4,
    user: {
      name: "Casey",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "text-theme-pink",
    },
    content: "Just a reminder that we have a team meeting tomorrow at 2 PM. Please prepare your updates.",
    timestamp: "Today at 10:40 AM",
    reactions: [{ emoji: "👀", count: 2 }],
    isPinned: true,
    isThread: false,
  },
  {
    id: 5,
    user: {
      name: "Alex",
      avatar: "/placeholder.svg?height=40&width=40",
      color: "text-theme-purple",
    },
    content: "Sure @Jordan, how about 3 PM today?",
    timestamp: "Today at 10:45 AM",
    reactions: [],
    isPinned: false,
    isThread: true,
    threadParentId: 3,
    threadCount: 3,
  },
]

const quickActions = [
  { icon: <Mic size={16} />, label: "Voice Message" },
  { icon: <ImageIcon size={16} />, label: "Image" },
  { icon: <Code size={16} />, label: "Code Block" },
  { icon: <MessageSquare size={16} />, label: "Thread" },
]

export default function TextChat() {
  const [messageText, setMessageText] = useState("")
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // In a real app, you would add the message to the messages array
      console.log("Sending message:", messageText)
      setMessageText("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="chat" className="flex flex-col h-full" onValueChange={setActiveTab}>
        <div className="border-b px-4 py-2">
          <TabsList className="grid w-52 grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-0">
          {/* Pinned messages */}
          {messages.some((m) => m.isPinned) && (
            <div className="bg-muted/50 p-3 border-b">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <span className="font-medium">Pinned Messages</span>
              </div>
              {messages
                .filter((m) => m.isPinned)
                .map((message) => (
                  <div key={`pinned-${message.id}`} className="flex items-start bg-background/80 p-2 rounded-md">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={message.user.avatar} />
                      <AvatarFallback className={message.user.color}>{message.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline">
                        <span className={`font-medium mr-2 ${message.user.color}`}>{message.user.name}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages
              .filter((m) => !m.isThread || m.threadParentId === undefined)
              .map((message) => (
                <div key={message.id} className="group">
                  <div className="flex hover:bg-muted/50 p-2 rounded-md -mx-2 transition-colors">
                    <Avatar className="h-10 w-10 mr-3 mt-0.5">
                      <AvatarImage src={message.user.avatar} />
                      <AvatarFallback className={message.user.color}>{message.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline">
                        <span className={`font-medium mr-2 ${message.user.color}`}>{message.user.name}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="text-sm mt-1">
                        {message.content.split(" ").map((word, i) =>
                          word.startsWith("@") ? (
                            <span key={i} className="text-theme-purple font-medium">
                              {word}{" "}
                            </span>
                          ) : (
                            <span key={i}>{word} </span>
                          ),
                        )}
                      </p>

                      <div className="flex mt-2 space-x-2">
                        {message.reactions.length > 0 && (
                          <div className="flex space-x-1">
                            {message.reactions.map((reaction, index) => (
                              <div
                                key={index}
                                className="flex items-center bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors"
                              >
                                <span className="mr-1">{reaction.emoji}</span>
                                <span>{reaction.count}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Thread indicator */}
                        {messages.some((m) => m.threadParentId === message.id) && (
                          <button
                            className="flex items-center text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-0.5 rounded-full transition-colors"
                            onClick={() => setActiveTab("threads")}
                          >
                            <MessageSquare size={12} className="mr-1" />
                            <span>{messages.filter((m) => m.threadParentId === message.id).length} replies</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 self-start mt-1 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Smile size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add Reaction</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MessageSquare size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reply in Thread</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="p-4 border-t bg-background/50 backdrop-blur-sm">
            <div className="relative">
              <Popover open={showQuickActions} onOpenChange={setShowQuickActions}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <PlusCircle size={20} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start" side="top">
                  <div className="grid grid-cols-2 gap-1">
                    {quickActions.map((action, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        className="justify-start text-sm h-9"
                        onClick={() => setShowQuickActions(false)}
                      >
                        <span className="mr-2">{action.icon}</span>
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-12 pr-24 py-6 bg-muted/50 border-muted focus-visible:ring-theme-purple"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <AtSign size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mention</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Paperclip size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Attach File</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
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
                        className="h-8 w-8 bg-theme-purple hover:bg-theme-purple/90"
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
          </div>
        </TabsContent>

        <TabsContent value="threads" className="flex-1 flex flex-col m-0 p-0">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <div className="flex">
                <Avatar className="h-10 w-10 mr-3 mt-0.5">
                  <AvatarImage src={messages[2].user.avatar} />
                  <AvatarFallback className={messages[2].user.color}>{messages[2].user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline">
                    <span className={`font-medium mr-2 ${messages[2].user.color}`}>{messages[2].user.name}</span>
                    <span className="text-xs text-muted-foreground">{messages[2].timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{messages[2].content}</p>
                </div>
              </div>

              <div className="mt-4 pl-12 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Replies</h4>

                {messages
                  .filter((m) => m.threadParentId === 3)
                  .map((message) => (
                    <div key={`thread-${message.id}`} className="flex group">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={message.user.avatar} />
                        <AvatarFallback className={message.user.color}>{message.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline">
                          <span className={`font-medium mr-2 ${message.user.color}`}>{message.user.name}</span>
                          <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}

                <div className="relative">
                  <Input placeholder="Reply in thread..." className="pl-3 pr-10 py-2 text-sm bg-muted/50" />
                  <Button className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-1 bg-theme-purple hover:bg-theme-purple/90">
                    <Send size={14} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>No more threads to display</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

