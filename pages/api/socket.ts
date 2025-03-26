import type { NextApiRequest } from "next"
import { Server as IOServer } from "socket.io"
import { Server as HTTPServer } from "http"
import type { NextApiResponseWithSocket } from "@/types/socket"
import type { User } from "@/contexts/app-context"

export const config = {
  api: {
    bodyParser: false,
  },
}

// channelId -> list of full user objects
const voiceChannelUsers = new Map<string, Map<string, User>>()
const socketToUser = new Map<string, { userId: string; channelId: string }>()

const ioHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {

    const httpServer: HTTPServer = res.socket.server as any
    const io = new IOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    io.on("connection", (socket) => {

      socket.on("join", ({ channelId, user }: { channelId: string; user: User }) => {
        const { id: userId } = user

        socket.join(channelId)
        socketToUser.set(socket.id, { userId, channelId })

        if (!voiceChannelUsers.has(channelId)) {
          voiceChannelUsers.set(channelId, new Map())
        }

        voiceChannelUsers.get(channelId)?.set(userId, user)
        broadcastVoiceUsers(io, channelId)
        socket.to(channelId).emit("user-joined", { userId, socketId: socket.id })
      })

      socket.on("leave", () => {
        const info = socketToUser.get(socket.id)
        if (info) {
          const { channelId, userId } = info
          socket.leave(channelId)
          voiceChannelUsers.get(channelId)?.delete(userId)
          socketToUser.delete(socket.id)
          broadcastVoiceUsers(io, channelId)
        }
      })

      socket.on("disconnect", () => {
        const info = socketToUser.get(socket.id)
        if (info) {
          const { channelId, userId } = info
          voiceChannelUsers.get(channelId)?.delete(userId)
          socketToUser.delete(socket.id)
          broadcastVoiceUsers(io, channelId)
        }
      })

      socket.on("user-muted", ({ userId, isMuted }) => {
        const { channelId } = socketToUser.get(socket.id) || {}
        if (!channelId) return
        const user = voiceChannelUsers.get(channelId)?.get(userId)
        if (user) {
          user.isMuted = isMuted
          broadcastVoiceUsers(io, channelId)
        }
      })

      socket.on("user-deafened", ({ userId, isDeafened }) => {
        const { channelId } = socketToUser.get(socket.id) || {}
        if (!channelId) return
        const user = voiceChannelUsers.get(channelId)?.get(userId)
        if (user) {
          user.isDeafened = isDeafened
          broadcastVoiceUsers(io, channelId)
        }
      })

      socket.on("ping", (cb) => {
        if (typeof cb === "function") cb()
      })
    })

    res.socket.server.io = io
  }

  res.end()
}

const broadcastVoiceUsers = (io: IOServer, channelId: string) => {
  const users = Array.from(voiceChannelUsers.get(channelId)?.values() || [])
  io.to(channelId).emit("voice-users", users)
}

export default ioHandler
