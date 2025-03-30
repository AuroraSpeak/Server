import {io, Socket} from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
    if(!socket) {
        socket= io({
            path: '/api/socket',
            addTrailingSlash: false,
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        })
    }
    return socket;
}