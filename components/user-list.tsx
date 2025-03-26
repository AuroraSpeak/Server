import { Crown, Shield, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const users = [
  {
    id: 1,
    name: "Alex",
    status: "online",
    role: "admin",
    muted: false,
    deafened: false,
    avatar: "/placeholder.svg?height=32&width=32",
    color: "text-theme-purple",
    activity: "Playing Cyberpunk 2077",
  },
  {
    id: 2,
    name: "Taylor",
    status: "online",
    role: "member",
    muted: true,
    deafened: false,
    avatar: "/placeholder.svg?height=32&width=32",
    color: "text-theme-teal",
  },
  {
    id: 3,
    name: "Jordan",
    status: "idle",
    role: "member",
    muted: false,
    deafened: false,
    avatar: "/placeholder.svg?height=32&width=32",
    color: "text-theme-amber",
  },
  {
    id: 4,
    name: "Casey",
    status: "online",
    role: "moderator",
    muted: false,
    deafened: true,
    avatar: "/placeholder.svg?height=32&width=32",
    color: "text-theme-pink",
  },
  {
    id: 5,
    name: "Riley",
    status: "offline",
    role: "member",
    muted: false,
    deafened: false,
    avatar: "/placeholder.svg?height=32&width=32",
    color: "text-muted-foreground",
  },
]

export default function UserList() {
  const onlineUsers = users.filter((user) => user.status !== "offline")
  const offlineUsers = users.filter((user) => user.status === "offline")

  const statusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "idle":
        return "bg-yellow-500"
      case "dnd":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const roleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown size={12} className="text-theme-amber" />
      case "moderator":
        return <Shield size={12} className="text-theme-teal" />
      default:
        return null
    }
  }

  const renderUser = (user: (typeof users)[0]) => (
    <div key={user.id} className="flex items-center py-2 px-3 hover:bg-muted rounded-md group transition-colors">
      <div className="relative mr-3">
        <Avatar
          className={`h-8 w-8 ring-1 ring-offset-1 ${user.status !== "offline" ? `ring-${user.color.split("-")[1]}` : "ring-muted"}`}
        >
          <AvatarImage src={user.avatar} />
          <AvatarFallback className={user.color}>{user.name[0]}</AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${statusColor(user.status)}`}
        ></span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <p className={`text-sm font-medium truncate ${user.status !== "offline" ? user.color : ""}`}>{user.name}</p>
          {roleIcon(user.role) && <span className="ml-1">{roleIcon(user.role)}</span>}
        </div>
        {user.activity && <p className="text-xs text-muted-foreground truncate">{user.activity}</p>}
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>Message</DropdownMenuItem>
            <DropdownMenuItem>Call</DropdownMenuItem>
            <DropdownMenuItem>View Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="w-60 border-l bg-muted/30 flex flex-col backdrop-blur-sm">
      <div className="p-4 border-b bg-gradient-to-r from-theme-teal/5 to-theme-purple/5">
        <h2 className="text-sm font-semibold">Users — {onlineUsers.length}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground px-3 py-1">Online — {onlineUsers.length}</h3>
          {onlineUsers.map(renderUser)}
        </div>

        {offlineUsers.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground px-3 py-1">Offline — {offlineUsers.length}</h3>
            {offlineUsers.map(renderUser)}
          </div>
        )}
      </div>
    </div>
  )
}

