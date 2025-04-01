"use client"

import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { Settings, Plus, Server } from "lucide-react"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { serverService } from "@/services/server"
import { useToast } from "@/hooks/use-toast"
import AuraLogo from "../AuraLogo"

export default function Sidebar() {
  const { serverId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [servers, setServers] = useState<Array<{ id: string; name: string }>>([])
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false)
  const [newServerName, setNewServerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const serversData = await serverService.getServers()
        setServers(serversData)
      } catch (error) {
        console.error("Failed to fetch servers:", error)
      }
    }

    fetchServers()
  }, [])

  const handleCreateServer = async () => {
    if (!newServerName.trim()) return

    setIsLoading(true)
    try {
      const newServer = await serverService.createServer({
        name: newServerName,
        ip: "localhost",
        port: 8080,
      })

      setServers((prev) => [...prev, newServer])
      setIsCreateServerOpen(false)
      setNewServerName("")

      toast({
        title: "Server erstellt",
        description: `"${newServer.name}" wurde erfolgreich erstellt.`,
      })

      navigate(`/server/${newServer.id}`)
    } catch (error) {
      toast({
        title: "Fehler beim Erstellen",
        description: "Der Server konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-[72px] flex-col items-center space-y-4 border-r bg-muted/40 py-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/" className="mb-2">
              <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 hover:bg-primary/20">
                <AuraLogo size={28} />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Home</p>
          </TooltipContent>
        </Tooltip>

        <div className="h-[2px] w-10 bg-border" />

        <div className="flex flex-col items-center space-y-3 overflow-y-auto scrollbar-hide">
          {servers.map((server) => (
            <Tooltip key={server.id}>
              <TooltipTrigger asChild>
                <Link to={`/server/${server.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`rounded-full transition-all ${
                      serverId === server.id
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Server className="h-5 w-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{server.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mt-auto rounded-full hover:bg-emerald-500/20 text-emerald-500"
              onClick={() => setIsCreateServerOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Server erstellen</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Einstellungen</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={isCreateServerOpen} onOpenChange={setIsCreateServerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Neuen Server erstellen</DialogTitle>
            <DialogDescription>Gib deinem Server einen Namen und starte mit deinen Freunden durch.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="Mein toller Server"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateServerOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateServer} disabled={isLoading || !newServerName.trim()}>
              {isLoading ? "Erstelle..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

