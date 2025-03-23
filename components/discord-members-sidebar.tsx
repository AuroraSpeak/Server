import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, Video } from "lucide-react"

interface MembersSidebarProps {
  members: any[]
}

export default function DiscordMembersSidebar({ members }: MembersSidebarProps) {
  // Group users by status (we'll simulate this since we don't have status in the schema)
  const onlineMembers = members.slice(0, Math.ceil(members.length * 0.7))
  const offlineMembers = members.slice(Math.ceil(members.length * 0.7))

  const renderUserStatus = (user: any) => {
    // Simulate voice states for some users
    const hasVoiceState = user.id % 3 === 0
    if (!hasVoiceState) return null

    return (
      <div className="flex items-center ml-auto">
        {user.id % 2 === 0 && (
          <div className="w-4 h-4 rounded-full bg-discord-red flex items-center justify-center mr-1">
            <Mic size={10} className="text-white" />
          </div>
        )}
        {user.id % 5 === 0 && (
          <div className="w-4 h-4 rounded-full bg-discord-blurple flex items-center justify-center mr-1">
            <Video size={10} className="text-white" />
          </div>
        )}
      </div>
    )
  }

  const renderUserGroup = (title: string, users: any[]) => {
    if (users.length === 0) return null

    return (
      <div className="mb-4">
        <h3 className="discord-category px-3">
          {title} — {users.length}
        </h3>
        {users.map((user) => (
          <div key={user.id} className="discord-voice-user group">
            <div className="relative mr-3">
              <Avatar className="h-8 w-8 avatar">
                <AvatarImage src={user.avatarUrl || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
              </div>
              {user.id % 4 === 0 && <p className="text-xs text-discord-text-muted truncate">Playing Game</p>}
            </div>
            {renderUserStatus(user)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="discord-members flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {renderUserGroup("ONLINE", onlineMembers)}
        {renderUserGroup("OFFLINE", offlineMembers)}
      </div>
    </div>
  )
}

