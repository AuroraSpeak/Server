package websocket

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gofiber/websocket/v2"
)

const (
	// Zeit zum Schreiben einer Nachricht an den Peer
	writeWait = 10 * time.Second

	// Zeit zum Lesen der nächsten Pong-Nachricht vom Peer
	pongWait = 60 * time.Second

	// Zeit zum Senden von Pings zum Peer
	pingPeriod = (pongWait * 9) / 10

	// Maximale Nachrichtengröße
	maxMessageSize = 512 * 1024 // 512KB
)

// Client repräsentiert einen verbundenen WebSocket-Client
type Client struct {
	ID   string
	Conn *websocket.Conn
	Hub  *Hub
	mu   sync.Mutex
	send chan []byte
	log  *Logger
}

// Hub verwaltet die aktiven WebSocket-Clients und leitet Nachrichten weiter
type Hub struct {
	// Registrierte Clients
	clients map[*Client]bool

	// Eingehende Nachrichten
	broadcast chan []byte

	// Client-Registrierung
	register chan *Client

	// Client-Deregistrierung
	unregister chan *Client

	log *Logger
}

// NewHub erstellt einen neuen Hub
func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		log:        NewLogger("Hub"),
	}
}

// Run startet den Hub
func (h *Hub) Run() {
	h.log.Info("Hub gestartet")
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			h.log.Info("Client %s registriert", client.ID)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				h.log.Info("Client %s deregistriert", client.ID)
			}

		case message := <-h.broadcast:
			h.log.Debug("Broadcasting Nachricht an %d Clients", len(h.clients))
			for client := range h.clients {
				select {
				case client.send <- message:
					h.log.Debug("Nachricht an Client %s gesendet", client.ID)
				default:
					h.log.Error("Fehler beim Senden an Client %s", client.ID)
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

// ReadPump pumpt Nachrichten vom WebSocket-Client zum Hub
func (c *Client) ReadPump() {
	defer func() {
		c.log.Info("Client %s: ReadPump wird beendet", c.ID)
		c.Hub.unregister <- c
		if c.Conn != nil {
			c.Conn.Close()
		}
	}()

	c.mu.Lock()
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	c.mu.Unlock()

	for {
		c.mu.Lock()
		_, message, err := c.Conn.ReadMessage()
		c.mu.Unlock()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.log.Error("Client %s: Unerwarteter WebSocket-Fehler: %v", c.ID, err)
			} else {
				c.log.Info("Client %s: WebSocket geschlossen: %v", c.ID, err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			c.log.Error("Client %s: Fehler beim Parsen der Nachricht: %v", c.ID, err)
			continue
		}

		c.log.Debug("Client %s: Nachricht empfangen: %s", c.ID, string(message))

		switch msg.Type {
		case "call-request", "offer", "answer", "ice-candidate":
			c.log.Info("Client %s: Weiterleite WebRTC-Signal-Nachricht vom Typ %s", c.ID, msg.Type)
			c.Hub.broadcast <- message
		case "ping":
			c.log.Debug("Client %s: Ping empfangen, sende Pong", c.ID)
			c.send <- []byte(`{"type":"pong"}`)
		default:
			c.log.Debug("Client %s: Unbekannter Nachrichtentyp: %s", c.ID, msg.Type)
		}
	}
}

// WritePump pumpt Nachrichten vom Hub zum WebSocket-Client
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		c.log.Info("Client %s: WritePump wird beendet", c.ID)
		ticker.Stop()
		if c.Conn != nil {
			c.Conn.Close()
		}
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.log.Info("Client %s: Send-Kanal wurde geschlossen", c.ID)
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.mu.Lock()
			c.log.Debug("Client %s: Sende Nachricht: %s", c.ID, string(message))
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				c.mu.Unlock()
				c.log.Error("Client %s: Fehler beim Erstellen des Writers: %v", c.ID, err)
				return
			}
			w.Write(message)

			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				c.mu.Unlock()
				c.log.Error("Client %s: Fehler beim Schließen des Writers: %v", c.ID, err)
				return
			}
			c.mu.Unlock()

		case <-ticker.C:
			c.mu.Lock()
			c.log.Debug("Client %s: Sende Ping", c.ID)
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.mu.Unlock()
				c.log.Error("Client %s: Ping fehlgeschlagen: %v", c.ID, err)
				return
			}
			c.mu.Unlock()
		}
	}
}
