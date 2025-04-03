package handlers_test

import (
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/janniskarpinski/auraspeak/backend/src/handlers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockHub struct {
	mock.Mock
}

func (m *MockHub) Register(client *handlers.Client) {
	m.Called(client)
}

func (m *MockHub) Unregister(client *handlers.Client) {
	m.Called(client)
}

func (m *MockHub) Broadcast(message []byte) {
	m.Called(message)
}

func TestWebSocketHandler(t *testing.T) {
	hub := new(MockHub)
	handler := handlers.NewWebSocketHandler(hub)

	t.Run("sollte neue Verbindung registrieren", func(t *testing.T) {
		// Mock-WebSocket-Verbindung erstellen
		conn := &websocket.Conn{}
		client := &handlers.Client{
			Hub:  hub,
			Conn: conn,
		}

		hub.On("Register", client).Return()

		handler.HandleWebSocket(conn)

		hub.AssertExpectations(t)
	})

	t.Run("sollte Nachrichten verarbeiten", func(t *testing.T) {
		conn := &websocket.Conn{}
		client := &handlers.Client{
			Hub:  hub,
			Conn: conn,
		}

		message := []byte(`{"type": "join-channel", "payload": {"channelId": "test-channel"}}`)

		hub.On("Register", client).Return()
		hub.On("Broadcast", message).Return()

		handler.HandleWebSocket(conn)
		time.Sleep(100 * time.Millisecond) // Warte auf Verarbeitung

		hub.AssertExpectations(t)
	})

	t.Run("sollte Verbindung bei Fehler schließen", func(t *testing.T) {
		conn := &websocket.Conn{}
		client := &handlers.Client{
			Hub:  hub,
			Conn: conn,
		}

		hub.On("Register", client).Return()
		hub.On("Unregister", client).Return()

		handler.HandleWebSocket(conn)
		time.Sleep(100 * time.Millisecond)

		hub.AssertExpectations(t)
	})
}

func TestChannelManagement(t *testing.T) {
	hub := new(MockHub)
	handler := handlers.NewWebSocketHandler(hub)

	t.Run("sollte Kanalbeitritt verarbeiten", func(t *testing.T) {
		conn := &websocket.Conn{}
		client := &handlers.Client{
			Hub:  hub,
			Conn: conn,
		}

		message := []byte(`{"type": "join-channel", "payload": {"channelId": "test-channel"}}`)

		hub.On("Register", client).Return()
		hub.On("Broadcast", message).Return()

		handler.HandleWebSocket(conn)
		time.Sleep(100 * time.Millisecond)

		assert.Equal(t, "test-channel", client.CurrentChannel)
		hub.AssertExpectations(t)
	})

	t.Run("sollte Kanalverlassen verarbeiten", func(t *testing.T) {
		conn := &websocket.Conn{}
		client := &handlers.Client{
			Hub:            hub,
			Conn:           conn,
			CurrentChannel: "test-channel",
		}

		message := []byte(`{"type": "leave-channel", "payload": {"channelId": "test-channel"}}`)

		hub.On("Register", client).Return()
		hub.On("Broadcast", message).Return()

		handler.HandleWebSocket(conn)
		time.Sleep(100 * time.Millisecond)

		assert.Empty(t, client.CurrentChannel)
		hub.AssertExpectations(t)
	})
}
