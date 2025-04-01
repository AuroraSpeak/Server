"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Plus, Users, Server, Clock, ArrowRight, Activity, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { serverService, type Server as ServerType } from "../services/server"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import AuraLogo from "../components/AuraLogo"

interface ActivityType {
  id: string
  type: "join" | "message"
  user: {
    name: string
    avatar: string
  }
  server: string
  time: string
}

export default function Dashboard() {
  const [servers, setServers] = useState<ServerType[]>([])
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false)
  const [newServerName, setNewServerName] = useState("")
  const [isCreatingServer, setIsCreatingServer] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const serversData = await serverService.getServers()
        setServers(serversData)

        // Mock activities data
        setActivities([
          {
            id: "1",
            type: "join",
            user: {
              name: "Max",
              avatar: "/placeholder.svg?height=40&width=40",
            },
            server: "Gaming Server",
            time: "5 Minuten",
          },
          {
            id: "2",
            type: "message",
            user: {
              name: "Anna",
              avatar: "/placeholder.svg?height=40&width=40",
            },
            server: "Allgemeiner Server",
            time: "10 Minuten",
          },
          {
            id: "3",
            type: "join",
            user: {
              name: "Tom",
              avatar: "/placeholder.svg?height=40&width=40",
            },
            server: "Musik Server",
            time: "15 Minuten",
          },
          {
            id: "4",
            type: "message",
            user: {
              name: "Lisa",
              avatar: "/placeholder.svg?height=40&width=40",
            },
            server: "Gaming Server",
            time: "30 Minuten",
          },
        ])
      } catch (error) {
        toast({
          title: "Fehler beim Laden der Daten",
          description: "Bitte versuchen Sie es später erneut.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleCreateServer = async () => {
    if (!newServerName.trim()) return

    setIsCreatingServer(true)
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
    } catch (error) {
      toast({
        title: "Fehler beim Erstellen",
        description: "Der Server konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingServer(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Lade Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Willkommen bei AuraSpeak</h1>
          <p className="text-muted-foreground mt-1">Deine Kommunikationsplattform für Sprache und Text</p>
        </div>
        <Button onClick={() => setIsCreateServerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Server erstellen
        </Button>
      </div>

      <Tabs defaultValue="servers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="servers" className="flex items-center">
            <Server className="h-4 w-4 mr-2" />
            Server
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Aktivitäten
          </TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {servers.length > 0 ? (
              servers.map((server) => (
                <Card key={server.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span>{server.name}</span>
                      <Badge variant={server.status === "online" ? "default" : "secondary"}>{server.status}</Badge>
                    </CardTitle>
                    <CardDescription>
                      {server.ip}:{server.port}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span>3 Benutzer online</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Zuletzt aktiv: {new Date().toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="default" asChild className="w-full">
                      <Link to={`/server/${server.id}`} className="flex items-center justify-center">
                        Beitreten
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>Keine Server gefunden</CardTitle>
                  <CardDescription>
                    Du hast noch keine Server erstellt oder bist keinem Server beigetreten.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsCreateServerOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Server erstellen
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <h2 className="text-2xl font-semibold">Letzte Aktivitäten</h2>
          {activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            <span className="font-semibold">{activity.user.name}</span>{" "}
                            {activity.type === "join" ? "ist beigetreten:" : "hat geschrieben in:"}{" "}
                            <span className="font-semibold">{activity.server}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">vor {activity.time}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/server/${servers.find((s) => s.name === activity.server)?.id || "#"}`}>
                          Ansehen
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Keine Aktivitäten vorhanden</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-8 border-t pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <AuraLogo size={40} />
            <div>
              <h2 className="text-xl font-bold">AuraSpeak</h2>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Einstellungen
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com/username/auraspeak" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Button>
          </div>
        </div>
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
            <Button variant="outline" onClick={() => setIsCreateServerOpen(false)} disabled={isCreatingServer}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateServer} disabled={isCreatingServer || !newServerName.trim()}>
              {isCreatingServer ? "Erstelle..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

