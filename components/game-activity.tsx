import { Gamepad2, Trophy, Users, Clock, BarChart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface GameActivityProps {
  game: {
    name: string
    icon?: string
    cover?: string
    progress?: number
    achievements?: {
      total: number
      completed: number
    }
    playtime?: string
    lastPlayed?: string
    friends?: {
      name: string
      avatar?: string
      status: "online" | "playing" | "offline"
    }[]
  }
}

export default function GameActivity({ game }: GameActivityProps) {
  return (
    <Card className="game-card overflow-hidden border-gaming-border">
      <div
        className="h-24 bg-cover bg-center"
        style={{
          backgroundImage: game.cover
            ? `url(${game.cover})`
            : "linear-gradient(to right, rgba(124, 77, 255, 0.5), rgba(0, 229, 255, 0.5))",
        }}
      >
        <div className="w-full h-full flex items-end p-3 bg-gradient-to-t from-gaming-dark/80 to-transparent">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-md bg-gaming-card flex items-center justify-center text-white mr-3 border border-gaming-border">
              {game.icon ? (
                <span className="text-2xl">{game.icon}</span>
              ) : (
                <Gamepad2 size={24} className="text-gaming-primary" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white">{game.name}</h3>
              {game.lastPlayed && (
                <p className="text-xs text-gaming-secondary flex items-center">
                  <Clock size={12} className="mr-1" />
                  Last played: {game.lastPlayed}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-3 space-y-4">
        {game.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-gaming-secondary">{game.progress}%</span>
            </div>
            <Progress value={game.progress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          {game.achievements && (
            <div className="flex items-center">
              <Trophy size={16} className="text-gaming-secondary mr-2" />
              <div>
                <div className="text-xs text-muted-foreground">Achievements</div>
                <div>
                  {game.achievements.completed}/{game.achievements.total}
                </div>
              </div>
            </div>
          )}

          {game.playtime && (
            <div className="flex items-center">
              <BarChart size={16} className="text-gaming-secondary mr-2" />
              <div>
                <div className="text-xs text-muted-foreground">Playtime</div>
                <div>{game.playtime}</div>
              </div>
            </div>
          )}
        </div>

        {game.friends && game.friends.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center">
                <Users size={14} className="mr-1" />
                Friends playing
              </div>
              <span className="text-xs text-gaming-secondary">
                {game.friends.filter((f) => f.status !== "offline").length} online
              </span>
            </div>

            <div className="space-y-1">
              {game.friends.slice(0, 3).map((friend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={friend.avatar || "/placeholder.svg?height=24&width=24"} />
                      <AvatarFallback className="text-xs bg-gaming-primary/20 text-gaming-primary">
                        {friend.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{friend.name}</span>
                  </div>
                  <div
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      friend.status === "playing"
                        ? "bg-gaming-primary/20 text-gaming-primary"
                        : friend.status === "online"
                          ? "bg-gaming-success/20 text-gaming-success"
                          : "bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    {friend.status === "playing" ? "Playing" : friend.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button size="sm" className="flex-1 bg-gaming-primary hover:bg-gaming-primary/90 text-white">
            Play
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-gaming-border text-muted-foreground hover:text-white"
          >
            Invite
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

