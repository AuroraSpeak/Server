import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, Video, Shield, Crown } from "lucide-react"
import type { User } from "@/contexts/app-context"

interface MembersSidebarProps {
  members: User[]
}

export default function AuraMembersSidebar({ members }: MembersSidebarProps) {
  // Group users by status
  const onlineMembers = members.filter((member) => member.status !== "offline")
  const offlineMembers = members.filter((member) => member.status === "offline")

  // Helper function to parse role string into array
  const getRoles = (roleString: string | null | undefined): string[] => {
    if (!roleString) return []
    return roleString.split(",").filter(Boolean)
  }

  const renderUserStatus = (user: User) => {
    // Simulate voice states for some users
    const hasVoiceState = user.id.charCodeAt(user.id.length - 1) % 3 === 0
    if (!hasVoiceState) return null

    return (
      <div className="flex items-center ml-auto">
        {user.id.charCodeAt(user.id.length - 1) % 2 === 0 && (
          <div className="w-4 h-4 rounded-full bg-aura-danger flex items-center justify-center mr-1">
            <Mic size={10} className="text-white" />
          </div>
        )}
        {user.id.charCodeAt(user.id.length - 1) % 5 === 0 && (
          <div className="w-4 h-4 rounded-full bg-aura-primary flex items-center justify-center mr-1">
            <Video size={10} className="text-white" />
          </div>
        )}
      </div>
    )
  }

  const renderRoleBadge = (user: User) => {
    // Check if user has roles
    const roles = getRoles(user.roleString)

    if (roles.includes("Admin")) {
      return (
        <div className="ml-1 text-yellow-400">
          <Crown size={12} />
        </div>
      )
    } else if (roles.includes("Moderator")) {
      return (
        <div className="ml-1 text-aura-primary">
          <Shield size={12} />
        </div>
      )
    }

    return null
  }

  const renderUserGroup = (title: string, users: User[]) => {
    if (users.length === 0) return null

    return (
      <div className="mb-4">
        <h3 className="aura-category px-3">
          {title} — {users.length}
        </h3>
        {users.map((user) => (
          <div key={user.id} className="aura-voice-user group">
            <div className="avatar-with-status relative mr-3">
              <Avatar className="h-8 w-8 avatar">
                <AvatarImage src={user.avatarUrl || "/placeholder.svg?height=32&width=32"} />
                <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div
                className={`status-indicator ${user.status === "online" ? "status-online" : user.status === "idle" ? "status-idle" : user.status === "dnd" ? "status-dnd" : "status-offline"}`}
              ></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                {renderRoleBadge(user)}
              </div>
              {user.id.charCodeAt(user.id.length - 1) % 4 === 0 && (
                <p className="text-xs text-aura-text-muted truncate">Playing Game</p>
              )}
            </div>
            {renderUserStatus(user)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="aura-members flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-4 px-2 scrollable">
        {renderUserGroup("ONLINE", onlineMembers)}
        {renderUserGroup("OFFLINE", offlineMembers)}
      </div>
    </div>
  )
}

