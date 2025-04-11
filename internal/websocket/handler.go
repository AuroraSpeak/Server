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
	ID        string
	ChannelID string // Channel ID hinzufügen
	Conn      *websocket.Conn
	Hub       *Hub
	mu        sync.Mutex
	send      chan []byte
	log       *Logger
	done      chan struct{}
}

// Hub verwaltet die aktiven WebSocket-Clients und leitet Nachrichten weiter
type Hub struct {
	// Clients nach Channel gruppiert
	channels map[string]map[*Client]bool

	// Eingehende Nachrichten
	broadcast chan []byte

	// Client-Registrierung
	register chan *Client

	// Client-Deregistrierung
	unregister chan *Client

	// Mutex für Thread-Sicherheit
	mu sync.RWMutex

	log *Logger
}

// NewHub erstellt eine neue Hub-Instanz
func NewHub(log *Logger) *Hub {
	return &Hub{
		channels:   make(map[string]map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		log:        log,
	}
}

// Run startet den Hub
func (h *Hub) Run() {
	h.log.Info("Hub gestartet")
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			// Erstelle Channel-Map falls nicht vorhanden
			if _, ok := h.channels[client.ChannelID]; !ok {
				h.channels[client.ChannelID] = make(map[*Client]bool)
			}
			// Füge Client zum Channel hinzu
			h.channels[client.ChannelID][client] = true
			h.mu.Unlock()
			h.log.Info("Client %s registriert in Channel %s", client.ID, client.ChannelID)

		case client := <-h.unregister:
			h.mu.Lock()
			// Entferne Client aus Channel
			if channel, ok := h.channels[client.ChannelID]; ok {
				if _, ok := channel[client]; ok {
					delete(channel, client)
					close(client.done)
					close(client.send)
					h.log.Info("Client %s aus Channel %s entfernt", client.ID, client.ChannelID)
				}
				// Lösche Channel wenn leer
				if len(channel) == 0 {
					delete(h.channels, client.ChannelID)
					h.log.Info("Channel %s gelöscht (keine Clients mehr)", client.ChannelID)
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			// Extrahiere Channel-ID aus der Nachricht
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				h.log.Error("Fehler beim Parsen der Broadcast-Nachricht: %v", err)
				h.mu.RUnlock()
				continue
			}

			// Sende Nachricht an alle Clients im Channel
			if channel, ok := h.channels[msg.ChannelID]; ok {
				h.log.Debug("Broadcasting Nachricht an %d Clients in Channel %s", len(channel), msg.ChannelID)
				for client := range channel {
					select {
					case client.send <- message:
						h.log.Debug("Nachricht an Client %s in Channel %s gesendet", client.ID, msg.ChannelID)
					default:
						h.log.Error("Fehler beim Senden an Client %s - Client wird deregistriert", client.ID)
						go func(c *Client) {
							h.unregister <- c
						}(client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// ReadPump pumpt Nachrichten vom WebSocket-Client zum Hub
func (c *Client) ReadPump() {
	defer func() {
		c.log.Info("Client %s: ReadPump wird beendet", c.ID)
		c.Hub.unregister <- c
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		select {
		case <-c.done:
			c.log.Info("Client %s: ReadPump beendet durch done-Signal", c.ID)
			return
		default:
			_, message, err := c.Conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					c.log.Error("Client %s: Unerwarteter WebSocket-Fehler: %v", c.ID, err)
				} else {
					c.log.Info("Client %s: WebSocket geschlossen: %v", c.ID, err)
				}
				return
			}

			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				c.log.Error("Client %s: Fehler beim Parsen der Nachricht: %v", c.ID, err)
				continue
			}

			c.log.Debug("Client %s: Nachricht empfangen: %s", c.ID, string(message))

			switch msg.Type {
			case MessageTypeCallRequest:
				c.log.Info("Client %s: Anrufanfrage empfangen für Raum %s", c.ID, msg.RoomID)
				c.Hub.broadcast <- message

			case MessageTypeOffer:
				if msg.TargetUserID == "" {
					c.log.Error("Client %s: Angebot ohne Ziel-UserID", c.ID)
					continue
				}
				c.log.Info("Client %s: Sende Angebot an Client %s", c.ID, msg.TargetUserID)
				c.Hub.broadcast <- message

			case MessageTypeAnswer:
				if msg.TargetUserID == "" {
					c.log.Error("Client %s: Antwort ohne Ziel-UserID", c.ID)
					continue
				}
				c.log.Info("Client %s: Sende Antwort an Client %s", c.ID, msg.TargetUserID)
				c.Hub.broadcast <- message

			case MessageTypeIceCandidate:
				if msg.TargetUserID == "" {
					c.log.Error("Client %s: ICE-Kandidat ohne Ziel-UserID", c.ID)
					continue
				}
				c.log.Info("Client %s: Sende ICE-Kandidat an Client %s", c.ID, msg.TargetUserID)
				c.Hub.broadcast <- message

			case MessageTypePing:
				c.log.Debug("Client %s: Ping empfangen, sende Pong", c.ID)
				response := Message{
					Type: MessageTypePong,
				}
				responseBytes, err := json.Marshal(response)
				if err != nil {
					c.log.Error("Client %s: Fehler beim Erstellen der Pong-Antwort: %v", c.ID, err)
					continue
				}
				c.send <- responseBytes

			default:
				c.log.Debug("Client %s: Unbekannter Nachrichtentyp: %s", c.ID, msg.Type)
			}
		}
	}
}

// WritePump pumpt Nachrichten vom Hub zum WebSocket-Client
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.log.Info("Client %s: WritePump wird beendet", c.ID)
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Der Hub hat den Channel geschlossen
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Füge wartende Nachrichten zur aktuellen WebSocket-Nachricht hinzu
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}

		case <-c.done:
			return
		}
	}
}
