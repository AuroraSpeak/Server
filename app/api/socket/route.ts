import { Server } from 'socket.io';
import { NextResponse } from 'next/server';

const ioHandler = (req: Request) => {
  if (!global.io) {
    console.log('Initializing Socket.IO server...');
    global.io = new Server({
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    global.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  return new NextResponse(null, { status: 200 });
};

export const GET = ioHandler;
export const POST = ioHandler; 