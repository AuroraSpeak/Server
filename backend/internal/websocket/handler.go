package websocket

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
)

type Client struct {
	ID   string
	Conn *websocket.Conn
	Hub  *Hub
	mu   sync.Mutex
}

type Hub struct {
	clients    map[string]*Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
}

type Message struct {
	Type         string          `json:"type"`
	TargetUserID string          `json:"targetUserId,omitempty"`
	Offer        json.RawMessage `json:"offer,omitempty"`
	Answer       json.RawMessage `json:"answer,omitempty"`
	Candidate    json.RawMessage `json:"candidate,omitempty"`
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client.ID] = client
			log.Printf("Client registered: %s", client.ID)

		case client := <-h.unregister:
			if _, ok := h.clients[client.ID]; ok {
				delete(h.clients, client.ID)
				close(client.Hub.broadcast)
			}
			client.Conn.Close()
			log.Printf("Client unregistered: %s", client.ID)

		case message := <-h.broadcast:
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			if targetClient, ok := h.clients[msg.TargetUserID]; ok {
				targetClient.mu.Lock()
				defer targetClient.mu.Unlock()
				if err := targetClient.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
					log.Printf("Error sending message to client %s: %v", msg.TargetUserID, err)
					targetClient.Conn.Close()
					delete(h.clients, msg.TargetUserID)
				}
			}
		}
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
	}()

	for {
		messageType, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Error reading message: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			switch msg.Type {
			case "call-request":
				// Handle call request
				c.Hub.broadcast <- message
			case "offer", "answer", "ice-candidate":
				// Forward WebRTC signaling messages
				c.Hub.broadcast <- message
			}
		}
	}
}
