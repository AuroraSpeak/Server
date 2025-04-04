import { defineStore } from 'pinia';

interface WebSocketState {
  socket: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  messageQueue: any[];
}

export const useWebSocketStore = defineStore('websocket', {
  state: (): WebSocketState => ({
    socket: null,
    isConnected: false,
    error: null,
    messageQueue: [],
  }),

  actions: {
    connect(url: string) {
      try {
        this.socket = new WebSocket(url);
        this.setupEventListeners();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create WebSocket connection';
        console.error('Failed to create WebSocket connection:', error);
        throw error;
      }
    },

    setupEventListeners() {
      if (!this.socket) return;

      this.socket.onopen = () => {
        this.isConnected = true;
        this.error = null;
        this.processMessageQueue();
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.socket = null;
      };

      this.socket.onerror = (error) => {
        this.error = 'WebSocket error occurred';
        console.error('WebSocket error:', error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    },

    sendMessage(message: any) {
      if (!this.socket) {
        this.messageQueue.push(message);
        return;
      }

      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      } else {
        this.messageQueue.push(message);
      }
    },

    processMessageQueue() {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.sendMessage(message);
      }
    },

    handleMessage(message: any) {
      // Hier können spezifische Nachrichtentypen verarbeitet werden
      console.log('Received message:', message);
    },

    disconnect() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
        this.isConnected = false;
      }
    },
  },
}); 