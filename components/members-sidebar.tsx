import { Crown, Shield } from "lucide-react"

interface MembersSidebarProps {
  members: any[]
}

export default function MembersSidebar({ members }: MembersSidebarProps) {
  const onlineMembers = members.filter((member) => member.status === "online")
  const offlineMembers = members.filter((member) => member.status === "offline")

  const getRoleIcon = (role: string) => {
    if (role === "admin") {
      return <Crown size={14} className="ml-1 text-[hsl(40,90%,60%)]" />
    } else if (role === "moderator") {
      return <Shield size={14} className="ml-1 text-[hsl(190,80%,50%)]" />
    }
    return null
  }

  return (
    <div className="members-sidebar flex flex-col">
      <div className="flex-1 overflow-y-auto scrollable py-4">
        {/* Online users */}
        <div className="user-section">
          <div className="user-section-title">ONLINE — {onlineMembers.length}</div>
          {onlineMembers.map((member) => (
            <div key={member.id} className="user-item">
              <div className="user-avatar">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">{member.avatar}</div>
                <div className="status-indicator status-online"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="user-name">{member.name}</span>
                  {getRoleIcon(member.role)}
                </div>
                {member.isPlaying && <div className="user-status">{member.game}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Offline users */}
        <div className="user-section">
          <div className="user-section-title">OFFLINE — {offlineMembers.length}</div>
          {offlineMembers.map((member) => (
            <div key={member.id} className="user-item">
              <div className="user-avatar">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center opacity-50">
                  {member.avatar}
                </div>
                <div className="status-indicator status-offline"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="user-name opacity-50">{member.name}</span>
                  {getRoleIcon(member.role)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

