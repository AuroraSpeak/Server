"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Users,
  Calendar,
  Bookmark,
  MessageSquare,
  Phone,
  Video,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { spaces } from "@/lib/data"

interface SpaceSelectorProps {
  activeSpace: string
  setActiveSpace: (spaceId: string) => void
  activeChannel: string
  setActiveChannel: (channelId: string) => void
  className?: string
}

export default function SpaceSelector({
  activeSpace,
  setActiveSpace,
  activeChannel,
  setActiveChannel,
  className,
}: SpaceSelectorProps) {
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>(
    spaces.reduce((acc, space) => ({ ...acc, [space.id]: space.id === activeSpace }), {}),
  )
  const [searchQuery, setSearchQuery] = useState("")

  const toggleSpace = (spaceId: string) => {
    setExpandedSpaces((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }))
  }

  const handleSpaceClick = (spaceId: string) => {
    setActiveSpace(spaceId)
    setExpandedSpaces((prev) => ({ ...prev, [spaceId]: true }))
    // Set the first channel as active
    const space = spaces.find((s) => s.id === spaceId)
    if (space && space.channels.length > 0) {
      setActiveChannel(space.channels[0].id)
    }
  }

  const filteredSpaces = searchQuery
    ? spaces.filter(
        (space) =>
          space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          space.channels.some((channel) => channel.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : spaces

  const getChannelIcon = (iconType: string) => {
    switch (iconType) {
      case "message":
        return <MessageSquare size={16} />
      case "phone":
        return <Phone size={16} />
      case "video":
        return <Video size={16} />
      case "calendar":
        return <Calendar size={16} />
      case "file":
        return <FileText size={16} />
      default:
        return <MessageSquare size={16} />
    }
  }

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Find a space..."
            className="pl-10 bg-slate-50 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 h-full">
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-500">SPACES</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500">
              <Plus size={16} />
            </Button>
          </div>

          <div className="space-y-2">
            {filteredSpaces.map((space) => (
              <Collapsible key={space.id} open={expandedSpaces[space.id]} onOpenChange={() => toggleSpace(space.id)}>
                <div
                  className={cn(
                    "flex items-center p-2 rounded-lg cursor-pointer",
                    activeSpace === space.id ? "bg-slate-100" : "hover:bg-slate-50",
                  )}
                  onClick={() => handleSpaceClick(space.id)}
                >
                  <div
                    className={cn("w-6 h-6 rounded-md flex items-center justify-center text-white mr-3", space.color)}
                  >
                    {space.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium flex-1">{space.name}</span>
                  <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400">
                      {expandedSpaces[space.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="mt-1 ml-4 pl-4 border-l border-slate-200 space-y-1">
                    {space.channels.map((channel) => (
                      <button
                        key={channel.id}
                        className={cn(
                          "flex items-center w-full p-2 text-sm rounded-md",
                          activeSpace === space.id && activeChannel === channel.id
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50",
                          "transition-colors",
                        )}
                        onClick={() => {
                          setActiveSpace(space.id)
                          setActiveChannel(channel.id)
                        }}
                      >
                        <span className="mr-2 text-slate-400">{getChannelIcon(channel.iconType)}</span>
                        <span className="flex-1 text-left">{channel.name}</span>
                        {channel.unread && <span className="h-2 w-2 rounded-full bg-emerald-500"></span>}
                      </button>
                    ))}

                    <button className="flex items-center w-full p-2 text-sm text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-50">
                      <Plus size={16} className="mr-2" />
                      <span>Add Channel</span>
                    </button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            <button className="flex items-center w-full p-2 text-sm text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-50">
              <Plus size={16} className="mr-2" />
              <span>Create New Space</span>
            </button>
          </div>
        </div>
      </ScrollArea>

      <div className="p-3 border-t mt-auto">
        <button className="flex items-center w-full p-2 text-sm text-slate-600 hover:text-slate-800 rounded-md hover:bg-slate-50">
          <Bookmark size={16} className="mr-2" />
          <span>Saved Items</span>
        </button>
        <button className="flex items-center w-full p-2 text-sm text-slate-600 hover:text-slate-800 rounded-md hover:bg-slate-50">
          <Users size={16} className="mr-2" />
          <span>People & Groups</span>
        </button>
        <button className="flex items-center w-full p-2 text-sm text-slate-600 hover:text-slate-800 rounded-md hover:bg-slate-50">
          <Calendar size={16} className="mr-2" />
          <span>Calendar</span>
        </button>
      </div>
    </div>
  )
}

