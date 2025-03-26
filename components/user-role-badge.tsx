import { Crown, Shield, Star } from "lucide-react"
import { stringToArray } from "@/lib/role-utils"

interface UserRoleBadgeProps {
  roleString: string | null
  size?: "sm" | "md" | "lg"
}

export default function UserRoleBadge({ roleString, size = "md" }: UserRoleBadgeProps) {
  if (!roleString) return null

  const roles = stringToArray(roleString)
  if (roles.length === 0) return null

  const iconSize = size === "sm" ? 12 : size === "md" ? 16 : 20

  if (roles.includes("Admin")) {
    return (
      <span className="inline-flex items-center text-yellow-400" title="Admin">
        <Crown size={iconSize} />
      </span>
    )
  } else if (roles.includes("Moderator")) {
    return (
      <span className="inline-flex items-center text-aura-primary" title="Moderator">
        <Shield size={iconSize} />
      </span>
    )
  } else if (roles.includes("Event Organizer")) {
    return (
      <span className="inline-flex items-center text-green-400" title="Event Organizer">
        <Star size={iconSize} />
      </span>
    )
  }

  return null
}

