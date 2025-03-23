"use client"
import { Plus, Compass, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AuraLogo from "./aura-logo"

interface ServerSidebarProps {
  activeServer: string
  setActiveServer: (serverId: string) => void
  servers: any[]
}

export default function DiscordServerSidebar({ activeServer, setActiveServer, servers }: ServerSidebarProps) {
  return (
    <div className="discord-sidebar flex flex-col items-center py-3 overflow-y-auto">
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

        <div className="discord-divider" />

        {/* Server list */}
        <div className="space-y-2">
          {servers.map((server) => (
            <Tooltip key={server.id}>
              <TooltipTrigger asChild>
                <button
                  className={cn("discord-server relative", activeServer === server.id && "active")}
                  onClick={() => setActiveServer(server.id)}
                >
                  {server.name.charAt(0)}
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
            <button className="discord-server mt-2 bg-discord-muted text-discord-interactive hover:bg-discord-green hover:text-white">
              <Plus size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Add a Server</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="discord-server mt-2 bg-discord-muted text-discord-interactive hover:bg-discord-blurple hover:text-white">
              <Compass size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Explore Servers</p>
          </TooltipContent>
        </Tooltip>

        <div className="discord-divider" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="discord-server bg-discord-muted text-discord-interactive hover:bg-discord-blurple hover:text-white">
              <Download size={24} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Download Apps</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

