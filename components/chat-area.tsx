"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Hash, AtSign, Gift, Sticker, Smile } from "lucide-react"

interface ChatAreaProps {
  messages: any[]
  channelName: string
  onSendMessage: (content: string) => void
}

export default function ChatArea({ messages, channelName, onSendMessage }: ChatAreaProps) {
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

  // Group messages by user
  const groupedMessages: { [key: string]: any[] } = {}
  messages.forEach((message) => {
    const key = `${message.userId}-${message.timestamp.split(":")[0]}`
    if (!groupedMessages[key]) {
      groupedMessages[key] = []
    }
    groupedMessages[key].push(message)
  })

  return (
    <div className="chat-area flex flex-col">
      <div className="channel-header">
        <Hash size={24} className="mr-2 text-gray-400" />
        <span>{channelName}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollable">
        <div className="py-4">
          {Object.values(groupedMessages).map((group, groupIndex) => (
            <div key={groupIndex} className="message-group">
              {group.map((message, messageIndex) => {
                const isFirstInGroup = messageIndex === 0

                return (
                  <div key={message.id} className="message">
                    {isFirstInGroup ? (
                      <div className="user-avatar mr-4">
                        <div className="w-10 h-10 rounded-full bg-[hsl(262,70%,40%)] flex items-center justify-center">
                          {message.user.avatar}
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 mr-4"></div>
                    )}

                    <div className="flex-1">
                      {isFirstInGroup && (
                        <div className="flex items-center">
                          <span className="font-medium text-white">{message.user.name}</span>
                          <span className="message-timestamp">{message.timestamp}</span>
                        </div>
                      )}
                      <div className="message-content">{message.content}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="message-input-container">
        <div className="relative">
          <input
            type="text"
            className="message-input"
            placeholder={`Message #${channelName}`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-2 top-2 flex items-center space-x-2">
            <button className="text-[hsl(214,10%,70%)] hover:text-white">
              <Gift size={20} />
            </button>
            <button className="text-[hsl(214,10%,70%)] hover:text-white">
              <Sticker size={20} />
            </button>
            <button className="text-[hsl(214,10%,70%)] hover:text-white">
              <Smile size={20} />
            </button>
            <button className="text-[hsl(214,10%,70%)] hover:text-white">
              <AtSign size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

