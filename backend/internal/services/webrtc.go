package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"

	"github.com/auraspeak/backend/internal/config"
	"github.com/auraspeak/backend/internal/models"
	"github.com/gofiber/websocket/v2"
	"github.com/pion/webrtc/v3"
	"gorm.io/gorm"
)

type WebRTCClient struct {
	Conn     *websocket.Conn
	ServerID string
}

type WebRTCMessage struct {
	Type     string          `json:"type"`
	From     string          `json:"from"`
	To       string          `json:"to"`
	Data     json.RawMessage `json:"data"`
	ServerID string          `json:"serverId"`
}

type WebRTCService struct {
	db              *gorm.DB
	peerConnections map[string]*webrtc.PeerConnection
	mu              sync.RWMutex
	api             *webrtc.API
	config          *config.Config
	connections     map[string]*ServerConnections
	clients         map[string]*WebRTCClient
	clientsMux      sync.RWMutex
}

type ServerConnections struct {
	// Speichert aktive Peer-Verbindungen pro Server
	peers map[string]*PeerConnection
	mu    sync.RWMutex
}

type PeerConnection struct {
	conn *webrtc.PeerConnection
	// Speichert die Audio-Sender
	audioTrack *webrtc.TrackLocalStaticSample
	// Speichert die Audio-Empfänger
	audioReceivers map[string]*webrtc.RTPReceiver
	mu             sync.RWMutex
}

type OfferRequest struct {
	ChannelID uint `json:"channelId"`
	Offer     webrtc.SessionDescription
}

type ICECandidateRequest struct {
	ChannelID uint `json:"channelId"`
	Candidate webrtc.ICECandidateInit
}

func NewWebRTCService(db *gorm.DB, cfg *config.Config) (*WebRTCService, error) {
	// Erstelle WebRTC API mit STUN/TURN Konfiguration
	webrtcConfig := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{},
	}

	// Füge STUN Server hinzu
	for _, stunServer := range cfg.STUNServers {
		webrtcConfig.ICEServers = append(webrtcConfig.ICEServers, webrtc.ICEServer{
			URLs: []string{stunServer},
		})
	}

	// Füge TURN Server hinzu
	for _, turnServer := range cfg.TURNServers {
		webrtcConfig.ICEServers = append(webrtcConfig.ICEServers, webrtc.ICEServer{
			URLs:       []string{turnServer.URL},
			Username:   turnServer.Username,
			Credential: turnServer.Password,
		})
	}

	// Füge lokalen TURN Server hinzu, wenn aktiviert
	if cfg.LocalTURN.Enabled {
		webrtcConfig.ICEServers = append(webrtcConfig.ICEServers, webrtc.ICEServer{
			URLs:       []string{fmt.Sprintf("turn:%s:%d", cfg.LocalTURN.PublicIP, cfg.LocalTURN.Port)},
			Username:   cfg.LocalTURN.Username,
			Credential: cfg.LocalTURN.Password,
		})
	}

	api := webrtc.NewAPI(webrtc.WithSettingEngine(webrtc.SettingEngine{}))

	return &WebRTCService{
		db:              db,
		peerConnections: make(map[string]*webrtc.PeerConnection),
		api:             api,
		config:          cfg,
		connections:     make(map[string]*ServerConnections),
		clients:         make(map[string]*WebRTCClient),
	}, nil
}

func (s *WebRTCService) GetChannel(channelID uint) (*models.Channel, error) {
	var channel models.Channel
	if err := s.db.First(&channel, channelID).Error; err != nil {
		return nil, err
	}
	return &channel, nil
}

func (s *WebRTCService) IsMember(serverID uint, userID uint) (bool, error) {
	var member models.Member
	err := s.db.Where("server_id = ? AND user_id = ?", serverID, userID).First(&member).Error
	if err == nil {
		return true, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return false, nil
	}
	return false, err
}

func (s *WebRTCService) CreateOffer(req OfferRequest) (*webrtc.SessionDescription, error) {
	// Implementierung folgt
	return nil, nil
}

func (s *WebRTCService) CreateAnswer(req OfferRequest) (*webrtc.SessionDescription, error) {
	// Implementierung folgt
	return nil, nil
}

func (s *WebRTCService) AddICECandidate(req ICECandidateRequest) error {
	// Implementierung folgt
	return nil
}

// Erstellt eine neue Peer-Verbindung für einen Server
func (s *WebRTCService) CreatePeerConnection(serverID string, userID string) (*webrtc.PeerConnection, error) {
	s.mu.Lock()
	serverConn, exists := s.connections[serverID]
	if !exists {
		serverConn = &ServerConnections{
			peers: make(map[string]*PeerConnection),
		}
		s.connections[serverID] = serverConn
	}
	s.mu.Unlock()

	serverConn.mu.Lock()
	defer serverConn.mu.Unlock()

	// Erstelle neue Peer-Verbindung
	peerConn, err := s.api.NewPeerConnection(webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create peer connection: %w", err)
	}

	// Erstelle Audio-Track
	audioTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "audio/opus"}, "audio", "pion")
	if err != nil {
		peerConn.Close()
		return nil, fmt.Errorf("failed to create audio track: %w", err)
	}

	// Füge Audio-Track zur Peer-Verbindung hinzu
	_, err = peerConn.AddTrack(audioTrack)
	if err != nil {
		peerConn.Close()
		return nil, fmt.Errorf("failed to add audio track: %w", err)
	}

	// Speichere Peer-Verbindung
	serverConn.peers[userID] = &PeerConnection{
		conn:           peerConn,
		audioTrack:     audioTrack,
		audioReceivers: make(map[string]*webrtc.RTPReceiver),
	}

	return peerConn, nil
}

// Verarbeitet ein Angebot von einem Client
func (s *WebRTCService) HandleOffer(serverID string, userID string, offer webrtc.SessionDescription) (*webrtc.SessionDescription, error) {
	s.mu.RLock()
	serverConn, exists := s.connections[serverID]
	s.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("server not found")
	}

	serverConn.mu.RLock()
	peer, exists := serverConn.peers[userID]
	serverConn.mu.RUnlock()

	if !exists {
		// Erstelle neue Peer-Verbindung
		_, err := s.CreatePeerConnection(serverID, userID)
		if err != nil {
			return nil, err
		}
		serverConn.mu.RLock()
		peer = serverConn.peers[userID]
		serverConn.mu.RUnlock()
	}

	// Setze Remote-Beschreibung
	if err := peer.conn.SetRemoteDescription(offer); err != nil {
		return nil, fmt.Errorf("failed to set remote description: %w", err)
	}

	// Erstelle Antwort
	answer, err := peer.conn.CreateAnswer(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create answer: %w", err)
	}

	// Setze lokale Beschreibung
	if err := peer.conn.SetLocalDescription(answer); err != nil {
		return nil, fmt.Errorf("failed to set local description: %w", err)
	}

	return &answer, nil
}

// Verarbeitet ICE-Kandidaten
func (s *WebRTCService) HandleICECandidate(serverID string, userID string, candidate webrtc.ICECandidateInit) error {
	s.mu.RLock()
	serverConn, exists := s.connections[serverID]
	s.mu.RUnlock()

	if !exists {
		return fmt.Errorf("server not found")
	}

	serverConn.mu.RLock()
	peer, exists := serverConn.peers[userID]
	serverConn.mu.RUnlock()

	if !exists {
		return fmt.Errorf("peer not found")
	}

	if err := peer.conn.AddICECandidate(candidate); err != nil {
		return fmt.Errorf("failed to add ICE candidate: %w", err)
	}

	return nil
}

// Schließt eine Peer-Verbindung
func (s *WebRTCService) ClosePeerConnection(serverID string, userID string) error {
	s.mu.RLock()
	serverConn, exists := s.connections[serverID]
	s.mu.RUnlock()

	if !exists {
		return fmt.Errorf("server not found")
	}

	serverConn.mu.Lock()
	defer serverConn.mu.Unlock()

	peer, exists := serverConn.peers[userID]
	if !exists {
		return fmt.Errorf("peer not found")
	}

	peer.conn.Close()
	delete(serverConn.peers, userID)

	// Wenn keine Peers mehr übrig sind, lösche den Server-Eintrag
	if len(serverConn.peers) == 0 {
		s.mu.Lock()
		delete(s.connections, serverID)
		s.mu.Unlock()
	}

	return nil
}

func (s *WebRTCService) AddClient(client *WebRTCClient) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()
	s.clients[client.ServerID] = client
	log.Printf("Neuer WebRTC-Client verbunden: %s", client.ServerID)
}

func (s *WebRTCService) RemoveClient(client *WebRTCClient) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()
	delete(s.clients, client.ServerID)
	log.Printf("WebRTC-Client getrennt: %s", client.ServerID)
}

func (s *WebRTCService) HandleMessage(client *WebRTCClient, message []byte) {
	var msg WebRTCMessage
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("Fehler beim Parsen der WebRTC-Nachricht: %v", err)
		return
	}

	msg.ServerID = client.ServerID

	switch msg.Type {
	case "offer":
		s.handleOffer(msg)
	case "answer":
		s.handleAnswer(msg)
	case "candidate":
		s.handleCandidate(msg)
	default:
		log.Printf("Unbekannter Nachrichtentyp: %s", msg.Type)
	}
}

func (s *WebRTCService) handleOffer(msg WebRTCMessage) {
	s.clientsMux.RLock()
	targetClient, exists := s.clients[msg.To]
	s.clientsMux.RUnlock()

	if !exists {
		log.Printf("Ziel-Client nicht gefunden: %s", msg.To)
		return
	}

	if err := targetClient.Conn.WriteJSON(msg); err != nil {
		log.Printf("Fehler beim Senden des Angebots: %v", err)
	}
}

func (s *WebRTCService) handleAnswer(msg WebRTCMessage) {
	s.clientsMux.RLock()
	targetClient, exists := s.clients[msg.To]
	s.clientsMux.RUnlock()

	if !exists {
		log.Printf("Ziel-Client nicht gefunden: %s", msg.To)
		return
	}

	if err := targetClient.Conn.WriteJSON(msg); err != nil {
		log.Printf("Fehler beim Senden der Antwort: %v", err)
	}
}

func (s *WebRTCService) handleCandidate(msg WebRTCMessage) {
	s.clientsMux.RLock()
	targetClient, exists := s.clients[msg.To]
	s.clientsMux.RUnlock()

	if !exists {
		log.Printf("Ziel-Client nicht gefunden: %s", msg.To)
		return
	}

	if err := targetClient.Conn.WriteJSON(msg); err != nil {
		log.Printf("Fehler beim Senden des ICE-Kandidaten: %v", err)
	}
}

func (s *WebRTCService) BroadcastToServer(serverID string, message interface{}) {
	s.clientsMux.RLock()
	defer s.clientsMux.RUnlock()

	for _, client := range s.clients {
		if client.ServerID == serverID {
			if err := client.Conn.WriteJSON(message); err != nil {
				log.Printf("Fehler beim Senden der Broadcast-Nachricht: %v", err)
			}
		}
	}
}
