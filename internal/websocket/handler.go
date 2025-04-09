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
	done chan struct{} // Koordinationskanal für sauberes Beenden
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

	// Mutex für Thread-Sicherheit
	mu sync.RWMutex

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
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			h.log.Info("Client %s registriert", client.ID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				h.log.Info("Deregistriere Client %s", client.ID)
				delete(h.clients, client)
				close(client.done) // Zuerst done-Channel schließen
				close(client.send) // Dann send-Channel schließen
				h.log.Info("Client %s deregistriert", client.ID)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			h.log.Debug("Broadcasting Nachricht an %d Clients", len(h.clients))
			for client := range h.clients {
				select {
				case client.send <- message:
					h.log.Debug("Nachricht an Client %s gesendet", client.ID)
				default:
					h.log.Error("Fehler beim Senden an Client %s - Client wird deregistriert", client.ID)
					go func(c *Client) {
						h.unregister <- c
					}(client)
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

	c.mu.Lock()
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.mu.Lock()
		defer c.mu.Unlock()
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	c.mu.Unlock()

	for {
		select {
		case <-c.done:
			c.log.Info("Client %s: ReadPump beendet durch done-Signal", c.ID)
			return
		default:
			c.mu.Lock()
			_, message, err := c.Conn.ReadMessage()
			c.mu.Unlock()

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
		c.log.Info("Client %s: WritePump wird beendet", c.ID)
		ticker.Stop()
	}()

	for {
		select {
		case <-c.done:
			c.log.Info("Client %s: WritePump beendet durch done-Signal", c.ID)
			return
		case message, ok := <-c.send:
			if !ok {
				c.log.Info("Client %s: Send-Kanal wurde geschlossen", c.ID)
				c.mu.Lock()
				err := c.Conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
				c.mu.Unlock()
				if err != nil {
					c.log.Error("Client %s: Fehler beim Senden der Close-Nachricht: %v", c.ID, err)
				}
				return
			}

			c.mu.Lock()
			c.log.Debug("Client %s: Sende Nachricht", c.ID)
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				c.mu.Unlock()
				c.log.Error("Client %s: Fehler beim Erstellen des Writers: %v", c.ID, err)
				return
			}

			if _, err := w.Write(message); err != nil {
				c.mu.Unlock()
				c.log.Error("Client %s: Fehler beim Schreiben der Nachricht: %v", c.ID, err)
				return
			}

			// Sende alle gepufferten Nachrichten
			n := len(c.send)
			for i := 0; i < n; i++ {
				nextMsg, ok := <-c.send
				if !ok {
					c.mu.Unlock()
					return
				}

				if _, err := w.Write([]byte{'\n'}); err != nil {
					c.mu.Unlock()
					c.log.Error("Client %s: Fehler beim Schreiben des Zeilenumbruchs: %v", c.ID, err)
					return
				}

				if _, err := w.Write(nextMsg); err != nil {
					c.mu.Unlock()
					c.log.Error("Client %s: Fehler beim Schreiben der gepufferten Nachricht: %v", c.ID, err)
					return
				}
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
