"use client"
import { Plus, Compass, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AuraLogo from "./aura-logo"
import type { Server } from "@/contexts/app-context"
import { useState } from "react"
import CreateServerDialog from "./create-server-dialog"

interface ServerSidebarProps {
  activeServer: string
  setActiveServer: (serverId: string) => void
  servers: Server[]
}

export default function AuraServerSidebar({ activeServer, setActiveServer, servers }: ServerSidebarProps) {
  const [showCreateServerDialog, setShowCreateServerDialog] = useState(false)
  const handleAddServer = () => {
    setShowCreateServerDialog(true)
  }

  const handleExploreServers = () => {
    alert("Explore servers functionality would open a server discovery page")
  }

  const handleDownloadApps = () => {
    alert("This would open a page to download desktop/mobile apps")
  }

  return (
    <>
    <div className="aura-sidebar flex flex-col items-center py-3 overflow-y-auto scrollable">
      <TooltipProvider>
        {/* Home button with AuraLogo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn("relative flex items-center justify-center mb-2", activeServer === "home" && "active")}
              onClick={() => setActiveServer("home")}
            >
              <AuraLogo size={48} />
              {activeServer === "home" && <span className="absolute left-0 w-1 h-10 bg-white rounded-r-md"></span>}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Home</p>
          </TooltipContent>
        </Tooltip>

        <div className="aura-divider" />

        {/* Server list */}
        <div className="space-y-2">
          {servers.map((server) => (
            <Tooltip key={server.id}>
              <TooltipTrigger asChild>
                <button
                  className={cn("aura-server relative", activeServer === server.id && "active")}
                  onClick={() => setActiveServer(server.id)}
                >
                  {server.icon}
                  {activeServer === server.id && (
                    <span className="absolute left-0 w-1 h-10 bg-white rounded-r-md"></span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{server.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="aura-server mt-2 bg-aura-muted text-aura-interactive hover:bg-aura-success hover:text-white"
              onClick={handleAddServer}
            >
              <Plus size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a Server</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="aura-server mt-2 bg-aura-muted text-aura-interactive hover:bg-aura-primary hover:text-white"
              onClick={handleExploreServers}
            >
              <Compass size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Explore Servers</p>
          </TooltipContent>
        </Tooltip>

        <div className="aura-divider" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="aura-server bg-aura-muted text-aura-interactive hover:bg-aura-primary hover:text-white"
              onClick={handleDownloadApps}
            >
              <Download size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Download Apps</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <CreateServerDialog isOpen={showCreateServerDialog} onClose={() => setShowCreateServerDialog(false)} />
    </>
  )
}

