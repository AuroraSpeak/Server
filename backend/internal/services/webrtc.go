package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/auraspeak/backend/internal/config"
	"github.com/auraspeak/backend/internal/models"
	"github.com/gofiber/websocket/v2"
	"github.com/pion/webrtc/v3"
	"gorm.io/gorm"
)

type OfferRequest struct {
	ClientID string `json:"clientId"`
	SDP      string `json:"sdp"`
}

type ICECandidateRequest struct {
	ClientID  string `json:"clientId"`
	Candidate string `json:"candidate"`
}

type WebRTCService struct {
	db              *gorm.DB
	api             *webrtc.API
	config          *webrtc.Configuration
	peerConnections map[string]*webrtc.PeerConnection
	connections     map[string]time.Time
	clients         map[string]*WebRTCClient
	clientsMux      sync.RWMutex
	stopChan        chan struct{}
}

type WebRTCClient struct {
	Conn     *websocket.Conn
	ServerID string
	UserID   string
}

type ServerConnections struct {
	peers map[string]*PeerConnection
	mu    sync.RWMutex
}

type PeerConnection struct {
	conn           *webrtc.PeerConnection
	audioTrack     *webrtc.TrackLocalStaticSample
	audioReceivers map[string]*webrtc.RTPReceiver
	lastActivity   time.Time
	mu             sync.RWMutex
}

type WebRTCMessage struct {
	Type      string                     `json:"type"`
	From      string                     `json:"from"`
	To        string                     `json:"to"`
	ServerID  string                     `json:"serverId"`
	Offer     *webrtc.SessionDescription `json:"offer,omitempty"`
	Answer    *webrtc.SessionDescription `json:"answer,omitempty"`
	Candidate *webrtc.ICECandidateInit   `json:"candidate,omitempty"`
	Payload   json.RawMessage            `json:"payload,omitempty"`
}

func NewWebRTCService(db *gorm.DB, cfg *config.Config) (*WebRTCService, error) {
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
			{
				URLs:       []string{"turn:openrelay.metered.ca:80"},
				Username:   "openrelayproject",
				Credential: "openrelayproject",
			},
		},
		ICETransportPolicy:   webrtc.ICETransportPolicyAll,
		BundlePolicy:         webrtc.BundlePolicyMaxBundle,
		RTCPMuxPolicy:        webrtc.RTCPMuxPolicyRequire,
		ICECandidatePoolSize: 10,
	}

	api := webrtc.NewAPI(webrtc.WithMediaEngine(&webrtc.MediaEngine{}))

	service := &WebRTCService{
		db:              db,
		api:             api,
		config:          &config,
		peerConnections: make(map[string]*webrtc.PeerConnection),
		connections:     make(map[string]time.Time),
		clients:         make(map[string]*WebRTCClient),
		stopChan:        make(chan struct{}),
	}

	go service.startCleanupRoutine()
	return service, nil
}

func (s *WebRTCService) startCleanupRoutine() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.cleanupInactiveConnections()
		}
	}
}

func (s *WebRTCService) cleanupInactiveConnections() {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	now := time.Now()
	for clientID, lastSeen := range s.connections {
		if now.Sub(lastSeen) > 5*time.Minute {
			if pc, exists := s.peerConnections[clientID]; exists {
				pc.Close()
				delete(s.peerConnections, clientID)
			}
			delete(s.connections, clientID)
			log.Printf("Inaktive Verbindung entfernt: %s", clientID)
		}
	}
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
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[req.ClientID]
	if !exists {
		var err error
		pc, err = s.CreatePeerConnection(req.ClientID)
		if err != nil {
			return nil, fmt.Errorf("Fehler beim Erstellen der PeerConnection: %v", err)
		}
	}

	offer, err := pc.CreateOffer(nil)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Erstellen des Angebots: %v", err)
	}

	if err := pc.SetLocalDescription(offer); err != nil {
		return nil, fmt.Errorf("Fehler beim Setzen der Local Description: %v", err)
	}

	s.connections[req.ClientID] = time.Now()
	return &offer, nil
}

func (s *WebRTCService) CreateAnswer(req OfferRequest) (*webrtc.SessionDescription, error) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[req.ClientID]
	if !exists {
		var err error
		pc, err = s.CreatePeerConnection(req.ClientID)
		if err != nil {
			return nil, fmt.Errorf("Fehler beim Erstellen der PeerConnection: %v", err)
		}
	}

	offer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  req.SDP,
	}

	if err := pc.SetRemoteDescription(offer); err != nil {
		return nil, fmt.Errorf("Fehler beim Setzen der Remote Description: %v", err)
	}

	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Erstellen der Antwort: %v", err)
	}

	if err := pc.SetLocalDescription(answer); err != nil {
		return nil, fmt.Errorf("Fehler beim Setzen der Local Description: %v", err)
	}

	s.connections[req.ClientID] = time.Now()
	return &answer, nil
}

func (s *WebRTCService) AddICECandidate(req ICECandidateRequest) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[req.ClientID]
	if !exists {
		return fmt.Errorf("Keine PeerConnection für Client %s gefunden", req.ClientID)
	}

	var iceCandidate webrtc.ICECandidateInit
	if err := json.Unmarshal([]byte(req.Candidate), &iceCandidate); err != nil {
		return fmt.Errorf("Fehler beim Parsen des ICE-Kandidaten: %v", err)
	}

	if err := pc.AddICECandidate(iceCandidate); err != nil {
		return fmt.Errorf("Fehler beim Hinzufügen des ICE-Kandidaten: %v", err)
	}

	s.connections[req.ClientID] = time.Now()
	return nil
}

func (s *WebRTCService) CreatePeerConnection(clientID string) (*webrtc.PeerConnection, error) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	if _, exists := s.peerConnections[clientID]; exists {
		return nil, fmt.Errorf("PeerConnection für Client %s existiert bereits", clientID)
	}

	pc, err := s.api.NewPeerConnection(*s.config)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Erstellen der PeerConnection: %v", err)
	}

	s.peerConnections[clientID] = pc
	s.connections[clientID] = time.Now()

	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("ICE Verbindungsstatus für Client %s geändert: %s", clientID, state)
	})

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("Verbindungsstatus für Client %s geändert: %s", clientID, state)
	})

	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}

		candidateJSON, err := json.Marshal(candidate)
		if err != nil {
			log.Printf("Fehler beim Marshalling des ICE-Kandidaten: %v", err)
			return
		}

		s.clientsMux.RLock()
		if client, exists := s.clients[clientID]; exists {
			if err := client.Conn.WriteJSON(WebRTCMessage{
				Type:    "ice-candidate",
				Payload: json.RawMessage(candidateJSON),
			}); err != nil {
				log.Printf("Fehler beim Senden des ICE-Kandidaten: %v", err)
			}
		}
		s.clientsMux.RUnlock()
	})

	return pc, nil
}

func (s *WebRTCService) HandleOffer(clientID string, sdp string) (string, error) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[clientID]
	if !exists {
		var err error
		pc, err = s.CreatePeerConnection(clientID)
		if err != nil {
			return "", err
		}
	}

	offer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  sdp,
	}

	if err := pc.SetRemoteDescription(offer); err != nil {
		return "", fmt.Errorf("Fehler beim Setzen der Remote Description: %v", err)
	}

	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		return "", fmt.Errorf("Fehler beim Erstellen der Antwort: %v", err)
	}

	if err := pc.SetLocalDescription(answer); err != nil {
		return "", fmt.Errorf("Fehler beim Setzen der Local Description: %v", err)
	}

	s.connections[clientID] = time.Now()
	return answer.SDP, nil
}

func (s *WebRTCService) HandleAnswer(clientID string, sdp string) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[clientID]
	if !exists {
		return fmt.Errorf("Keine PeerConnection für Client %s gefunden", clientID)
	}

	answer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeAnswer,
		SDP:  sdp,
	}

	if err := pc.SetRemoteDescription(answer); err != nil {
		return fmt.Errorf("Fehler beim Setzen der Remote Description: %v", err)
	}

	s.connections[clientID] = time.Now()
	return nil
}

func (s *WebRTCService) HandleICECandidate(clientID string, candidate string) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[clientID]
	if !exists {
		return fmt.Errorf("Keine PeerConnection für Client %s gefunden", clientID)
	}

	var iceCandidate webrtc.ICECandidateInit
	if err := json.Unmarshal([]byte(candidate), &iceCandidate); err != nil {
		return fmt.Errorf("Fehler beim Parsen des ICE-Kandidaten: %v", err)
	}

	if err := pc.AddICECandidate(iceCandidate); err != nil {
		return fmt.Errorf("Fehler beim Hinzufügen des ICE-Kandidaten: %v", err)
	}

	s.connections[clientID] = time.Now()
	return nil
}

func (s *WebRTCService) ClosePeerConnection(clientID string) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[clientID]
	if !exists {
		return nil
	}

	if err := pc.Close(); err != nil {
		return fmt.Errorf("Fehler beim Schließen der PeerConnection: %v", err)
	}

	delete(s.peerConnections, clientID)
	delete(s.connections, clientID)

	if client, exists := s.clients[clientID]; exists {
		if err := client.Conn.Close(); err != nil {
			log.Printf("Fehler beim Schließen der Client-Verbindung: %v", err)
		}
		delete(s.clients, clientID)
	}

	return nil
}

func (s *WebRTCService) AddClient(client *WebRTCClient) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()
	s.clients[client.ServerID] = client
	log.Printf("Neuer WebRTC-Client verbunden: %s (User: %s)", client.ServerID, client.UserID)
}

func (s *WebRTCService) RemoveClient(client *WebRTCClient) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()
	delete(s.clients, client.ServerID)
	log.Printf("WebRTC-Client getrennt: %s (User: %s)", client.ServerID, client.UserID)
}

func (s *WebRTCService) HandleMessage(client *WebRTCClient, message []byte) {
	var msg WebRTCMessage
	if err := json.Unmarshal(message, &msg); err != nil {
		log.Printf("Fehler beim Parsen der WebRTC-Nachricht: %v", err)
		return
	}

	msg.ServerID = client.ServerID
	msg.From = client.UserID

	switch msg.Type {
	case "offer":
		s.handleOffer(msg)
	case "answer":
		s.handleAnswer(msg)
	case "candidate":
		s.handleCandidate(msg)
	case "disconnect":
		s.handleDisconnect(msg)
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

func (s *WebRTCService) handleDisconnect(msg WebRTCMessage) {
	s.clientsMux.RLock()
	targetClient, exists := s.clients[msg.To]
	s.clientsMux.RUnlock()

	if !exists {
		return
	}

	if err := targetClient.Conn.WriteJSON(msg); err != nil {
		log.Printf("Fehler beim Senden der Disconnect-Nachricht: %v", err)
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

func (s *WebRTCService) Close() {
	close(s.stopChan)
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	for _, pc := range s.peerConnections {
		if err := pc.Close(); err != nil {
			log.Printf("Fehler beim Schließen der PeerConnection: %v", err)
		}
	}

	s.peerConnections = make(map[string]*webrtc.PeerConnection)
	s.connections = make(map[string]time.Time)

	for _, client := range s.clients {
		if err := client.Conn.Close(); err != nil {
			log.Printf("Fehler beim Schließen der Client-Verbindung: %v", err)
		}
	}
	s.clients = make(map[string]*WebRTCClient)
}
