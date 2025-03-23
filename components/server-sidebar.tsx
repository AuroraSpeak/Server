"use client"

import { cn } from "@/lib/utils"
import AuraLogo from "./aura-logo"

interface ServerSidebarProps {
  servers: any[]
  activeServer: string
  setActiveServer: (serverId: string) => void
}

export default function ServerSidebar({ servers, activeServer, setActiveServer }: ServerSidebarProps) {
  return (
    <div className="server-sidebar scrollable">
      <div className="flex flex-col items-center pt-3">
        {/* AuraSpeak logo */}
        <button className="mb-2 flex items-center justify-center relative" onClick={() => setActiveServer("home")}>
          <AuraLogo size={48} />
        </button>

        <div className="server-divider" />

        {/* Server list */}
        {servers.map((server) => (
          <button
            key={server.id}
            className={cn("server-icon relative", activeServer === server.id && "active")}
            onClick={() => setActiveServer(server.id)}
          >
            {server.icon}
            {activeServer === server.id && <span className="absolute left-0 w-1 h-10 bg-white rounded-r-md"></span>}
          </button>
        ))}
      </div>
    </div>
  )
}

