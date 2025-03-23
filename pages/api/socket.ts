import type { NextApiRequest } from "next";
import { Server as IOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import type { Socket as NetSocket } from "net";
import type { NextApiResponseWithSocket } from "@/types/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");

    const httpServer: HTTPServer = res.socket.server as any;
    const io = new IOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
        console.log("User joined")

        socket.on("join", ({channelId, userId}) => {
            socket.join(channelId),
            socket.to(channelId).emit("user-joined", {userId, socketId: socket.id})
        })

        socket.on("signal", ({to, from, data}) => {
            io.to(to).emit("signal", {from, data})
        })
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id)
        })
    })

    res.socket.server.io = io;
  }
  res.end()
};

export default ioHandler;