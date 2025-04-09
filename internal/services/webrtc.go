package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/types"
	"github.com/gofiber/websocket/v2"
	"github.com/pion/rtp"
	"github.com/pion/webrtc/v3"
	"go.uber.org/zap"
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
	logger          *zap.Logger
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

func NewWebRTCService(cfg *webrtc.Configuration, logger *zap.Logger) *WebRTCService {
	return &WebRTCService{
		config:          cfg,
		logger:          logger,
		peerConnections: make(map[string]*webrtc.PeerConnection),
		connections:     make(map[string]time.Time),
		clients:         make(map[string]*WebRTCClient),
		stopChan:        make(chan struct{}),
	}
}

func (s *WebRTCService) startCleanupRoutine() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			s.logger.Info("Cleanup-Routine beendet")
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
			s.logger.Info("Inaktive Verbindung entfernt",
				zap.String("clientID", clientID),
			)
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

func (s *WebRTCService) CreateOffer(req types.OfferRequest) (interface{}, error) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, err := s.CreatePeerConnection(req.ClientID)
	if err != nil {
		return nil, err
	}

	offer, err := pc.CreateOffer(nil)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Erstellen des Offers: %v", err)
	}

	if err := pc.SetLocalDescription(offer); err != nil {
		return nil, fmt.Errorf("Fehler beim Setzen der Local Description: %v", err)
	}

	return offer, nil
}

func (s *WebRTCService) CreateAnswer(req types.OfferRequest) (interface{}, error) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, err := s.CreatePeerConnection(req.ClientID)
	if err != nil {
		return nil, err
	}

	offer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  string(req.SDP),
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

	return answer, nil
}

func (s *WebRTCService) AddICECandidate(req types.ICECandidateRequest) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	s.logger.Debug("Neuer ICE-Kandidat wird hinzugefügt",
		zap.String("clientID", req.ClientID),
	)

	pc, exists := s.peerConnections[req.ClientID]
	if !exists {
		s.logger.Error("Keine PeerConnection für Client gefunden",
			zap.String("clientID", req.ClientID),
		)
		return fmt.Errorf("Keine PeerConnection für Client %s gefunden", req.ClientID)
	}

	var iceCandidate webrtc.ICECandidateInit
	if err := json.Unmarshal([]byte(req.Candidate), &iceCandidate); err != nil {
		s.logger.Error("Fehler beim Parsen des ICE-Kandidaten",
			zap.Error(err),
			zap.String("clientID", req.ClientID),
		)
		return fmt.Errorf("Fehler beim Parsen des ICE-Kandidaten: %v", err)
	}

	if err := pc.AddICECandidate(iceCandidate); err != nil {
		s.logger.Error("Fehler beim Hinzufügen des ICE-Kandidaten",
			zap.Error(err),
			zap.String("clientID", req.ClientID),
		)
		return fmt.Errorf("Fehler beim Hinzufügen des ICE-Kandidaten: %v", err)
	}

	s.connections[req.ClientID] = time.Now()
	s.logger.Debug("ICE-Kandidat erfolgreich hinzugefügt",
		zap.String("clientID", req.ClientID),
	)
	return nil
}

func (s *WebRTCService) CreatePeerConnection(clientID string) (*webrtc.PeerConnection, error) {
	s.logger.Debug("Erstelle neue PeerConnection",
		zap.String("clientID", clientID),
	)

	// Erstelle MediaEngine
	mediaEngine := webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return nil, fmt.Errorf("Fehler beim Registrieren der Codecs: %v", err)
	}

	// Erstelle API mit MediaEngine
	api := webrtc.NewAPI(webrtc.WithMediaEngine(&mediaEngine))

	// Erstelle PeerConnection
	peerConnection, err := api.NewPeerConnection(*s.config)
	if err != nil {
		return nil, fmt.Errorf("Fehler beim Erstellen der PeerConnection: %v", err)
	}

	// Audio-Track erstellen
	audioTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: "audio/opus"},
		fmt.Sprintf("audio-%s", clientID),
		fmt.Sprintf("stream-%s", clientID),
	)
	if err != nil {
		peerConnection.Close()
		return nil, fmt.Errorf("Fehler beim Erstellen des Audio-Tracks: %v", err)
	}

	// Track zur PeerConnection hinzufügen
	if _, err = peerConnection.AddTrack(audioTrack); err != nil {
		peerConnection.Close()
		return nil, fmt.Errorf("Fehler beim Hinzufügen des Audio-Tracks: %v", err)
	}

	// ICE Candidate Handler
	peerConnection.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}

		s.logger.Debug("Neuer ICE Kandidat",
			zap.String("clientID", clientID),
			zap.String("candidate", candidate.String()),
		)

		// Sende Kandidat an Client
		candidateJSON := candidate.ToJSON()
		msg := WebRTCMessage{
			Type:      "ice-candidate",
			From:      "server",
			To:        clientID,
			Candidate: &candidateJSON,
		}

		if client, ok := s.clients[clientID]; ok {
			if err := client.Conn.WriteJSON(msg); err != nil {
				s.logger.Error("Fehler beim Senden des ICE-Kandidaten",
					zap.String("clientID", clientID),
					zap.Error(err),
				)
			}
		}
	})

	// Verbindungsstatus-Handler
	peerConnection.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		s.logger.Info("PeerConnection Status geändert",
			zap.String("clientID", clientID),
			zap.String("state", state.String()),
		)

		switch state {
		case webrtc.PeerConnectionStateFailed:
			if err := peerConnection.Close(); err != nil {
				s.logger.Error("Fehler beim Schließen der fehlgeschlagenen PeerConnection",
					zap.String("clientID", clientID),
					zap.Error(err),
				)
			}
			s.clientsMux.Lock()
			delete(s.peerConnections, clientID)
			s.clientsMux.Unlock()
		case webrtc.PeerConnectionStateConnected:
			s.clientsMux.Lock()
			s.connections[clientID] = time.Now()
			s.clientsMux.Unlock()
		}
	})

	// Track-Handler
	peerConnection.OnTrack(func(remoteTrack *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		s.logger.Info("Neuer Remote-Track empfangen",
			zap.String("clientID", clientID),
			zap.String("trackID", remoteTrack.ID()),
			zap.String("kind", remoteTrack.Kind().String()),
		)

		// Starte Audio-Handling in einer Goroutine
		go s.handleAudioTrack(clientID, remoteTrack, receiver)
	})

	s.peerConnections[clientID] = peerConnection
	s.connections[clientID] = time.Now()

	return peerConnection, nil
}

func (s *WebRTCService) handleAudioTrack(clientID string, track *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
	s.logger.Info("Starte Audio-Track-Handling",
		zap.String("clientID", clientID),
		zap.String("trackID", track.ID()),
	)

	// Buffer für RTP-Pakete
	buffer := make([]byte, 1500)
	for {
		n, _, err := track.Read(buffer)
		if err != nil {
			s.logger.Error("Fehler beim Lesen des Audio-Tracks",
				zap.String("clientID", clientID),
				zap.Error(err),
			)
			return
		}

		// Parse RTP-Paket
		packet := &rtp.Packet{}
		if err := packet.Unmarshal(buffer[:n]); err != nil {
			s.logger.Error("Fehler beim Unmarshalling des RTP-Pakets",
				zap.String("clientID", clientID),
				zap.Error(err),
			)
			continue
		}

		// Hole Client-Informationen
		s.clientsMux.RLock()
		client, exists := s.clients[clientID]
		s.clientsMux.RUnlock()

		if !exists {
			s.logger.Error("Client nicht gefunden",
				zap.String("clientID", clientID),
			)
			return
		}

		// Leite Audio an alle anderen Clients im gleichen Raum weiter
		s.forwardAudioToRoom(clientID, packet, client.ServerID)
	}
}

func (s *WebRTCService) forwardAudioToRoom(sourceClientID string, packet *rtp.Packet, roomID string) {
	s.clientsMux.RLock()
	defer s.clientsMux.RUnlock()

	// Iteriere über alle Peers im Raum
	for clientID, client := range s.clients {
		// Überspringe den Sender
		if clientID == sourceClientID {
			continue
		}

		// Überprüfe, ob der Client im gleichen Raum ist
		if client.ServerID != roomID {
			continue
		}

		// Hole die PeerConnection
		if pc, exists := s.peerConnections[clientID]; exists {
			if senders := pc.GetSenders(); len(senders) > 0 {
				for _, sender := range senders {
					if track := sender.Track(); track != nil {
						if localTrack, ok := track.(*webrtc.TrackLocalStaticRTP); ok {
							if err := localTrack.WriteRTP(packet); err != nil {
								s.logger.Error("Fehler beim Weiterleiten des Audio-Pakets",
									zap.String("sourceClientID", sourceClientID),
									zap.String("targetClientID", clientID),
									zap.Error(err),
								)
							}
						}
					}
				}
			}
		}
	}
}

func (s *WebRTCService) HandleOffer(clientID string, payload json.RawMessage) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[clientID]
	if !exists {
		var err error
		pc, err = s.CreatePeerConnection(clientID)
		if err != nil {
			return err
		}
	}

	offer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  string(payload),
	}

	if err := pc.SetRemoteDescription(offer); err != nil {
		return fmt.Errorf("Fehler beim Setzen der Remote Description: %v", err)
	}

	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		return fmt.Errorf("Fehler beim Erstellen der Antwort: %v", err)
	}

	if err := pc.SetLocalDescription(answer); err != nil {
		return fmt.Errorf("Fehler beim Setzen der Local Description: %v", err)
	}

	s.connections[clientID] = time.Now()
	return nil
}

func (s *WebRTCService) HandleAnswer(clientID string, payload json.RawMessage) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[clientID]
	if !exists {
		return fmt.Errorf("Keine PeerConnection für Client %s gefunden", clientID)
	}

	answer := webrtc.SessionDescription{
		Type: webrtc.SDPTypeAnswer,
		SDP:  string(payload),
	}

	if err := pc.SetRemoteDescription(answer); err != nil {
		return fmt.Errorf("Fehler beim Setzen der Remote Description: %v", err)
	}

	s.connections[clientID] = time.Now()
	return nil
}

func (s *WebRTCService) HandleICECandidate(clientID string, payload json.RawMessage) error {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	pc, exists := s.peerConnections[clientID]
	if !exists {
		return fmt.Errorf("Keine PeerConnection für Client %s gefunden", clientID)
	}

	var iceCandidate webrtc.ICECandidateInit
	if err := json.Unmarshal(payload, &iceCandidate); err != nil {
		return fmt.Errorf("Fehler beim Parsen des ICE-Kandidaten: %v", err)
	}

	if err := pc.AddICECandidate(iceCandidate); err != nil {
		return fmt.Errorf("Fehler beim Hinzufügen des ICE-Kandidaten: %v", err)
	}

	s.connections[clientID] = time.Now()
	return nil
}

func (s *WebRTCService) ClosePeerConnection(clientID string) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	if pc, exists := s.peerConnections[clientID]; exists {
		pc.Close()
		delete(s.peerConnections, clientID)
		delete(s.connections, clientID)
	}
}

func (s *WebRTCService) AddClient(client *WebRTCClient) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()
	s.clients[client.ServerID] = client
	s.logger.Info("Neuer WebRTC-Client verbunden",
		zap.String("serverID", client.ServerID),
		zap.String("userID", client.UserID),
	)
}

func (s *WebRTCService) RemoveClient(client *WebRTCClient) {
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()
	delete(s.clients, client.ServerID)
	s.logger.Info("WebRTC-Client getrennt",
		zap.String("serverID", client.ServerID),
		zap.String("userID", client.UserID),
	)
}

func (s *WebRTCService) HandleMessage(client *WebRTCClient, message []byte) {
	var msg WebRTCMessage
	if err := json.Unmarshal(message, &msg); err != nil {
		s.logger.Error("Fehler beim Parsen der WebRTC-Nachricht",
			zap.Error(err),
			zap.String("serverID", client.ServerID),
			zap.String("userID", client.UserID),
		)
		return
	}

	msg.ServerID = client.ServerID
	msg.From = client.UserID

	s.logger.Debug("WebRTC-Nachricht empfangen",
		zap.String("type", msg.Type),
		zap.String("from", msg.From),
		zap.String("to", msg.To),
		zap.String("serverID", msg.ServerID),
	)

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
		s.logger.Warn("Unbekannter Nachrichtentyp",
			zap.String("type", msg.Type),
			zap.String("from", msg.From),
			zap.String("to", msg.To),
		)
	}
}

func (s *WebRTCService) handleOffer(msg WebRTCMessage) {
	s.clientsMux.RLock()
	targetClient, exists := s.clients[msg.To]
	s.clientsMux.RUnlock()

	if !exists {
		s.logger.Warn("Ziel-Client nicht gefunden",
			zap.String("targetID", msg.To),
		)
		return
	}

	if err := targetClient.Conn.WriteJSON(msg); err != nil {
		s.logger.Error("Fehler beim Senden des Angebots",
			zap.Error(err),
			zap.String("targetID", msg.To),
		)
	}
}

func (s *WebRTCService) handleAnswer(msg WebRTCMessage) {
	s.clientsMux.RLock()
	targetClient, exists := s.clients[msg.To]
	s.clientsMux.RUnlock()

	if !exists {
		s.logger.Warn("Ziel-Client nicht gefunden",
			zap.String("targetID", msg.To),
		)
		return
	}

	if err := targetClient.Conn.WriteJSON(msg); err != nil {
		s.logger.Error("Fehler beim Senden der Antwort",
			zap.Error(err),
			zap.String("targetID", msg.To),
		)
	}
}

func (s *WebRTCService) handleCandidate(msg WebRTCMessage) {
	s.clientsMux.RLock()
	targetClient, exists := s.clients[msg.To]
	s.clientsMux.RUnlock()

	if !exists {
		s.logger.Warn("Ziel-Client nicht gefunden",
			zap.String("targetID", msg.To),
		)
		return
	}

	if err := targetClient.Conn.WriteJSON(msg); err != nil {
		s.logger.Error("Fehler beim Senden des ICE-Kandidaten",
			zap.Error(err),
			zap.String("targetID", msg.To),
		)
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
		s.logger.Error("Fehler beim Senden der Disconnect-Nachricht",
			zap.Error(err),
			zap.String("targetID", msg.To),
		)
	}
}

func (s *WebRTCService) BroadcastToServer(serverID string, message interface{}) {
	s.clientsMux.RLock()
	defer s.clientsMux.RUnlock()

	for _, client := range s.clients {
		if client.ServerID == serverID {
			if err := client.Conn.WriteJSON(message); err != nil {
				s.logger.Error("Fehler beim Senden der Broadcast-Nachricht",
					zap.Error(err),
					zap.String("serverID", serverID),
					zap.String("userID", client.UserID),
				)
			}
		}
	}
}

func (s *WebRTCService) Close() {
	s.logger.Info("WebRTC-Service wird beendet")
	close(s.stopChan)
	s.clientsMux.Lock()
	defer s.clientsMux.Unlock()

	for _, pc := range s.peerConnections {
		if err := pc.Close(); err != nil {
			s.logger.Error("Fehler beim Schließen der PeerConnection",
				zap.Error(err),
			)
		}
	}

	s.peerConnections = make(map[string]*webrtc.PeerConnection)
	s.connections = make(map[string]time.Time)

	for _, client := range s.clients {
		if err := client.Conn.Close(); err != nil {
			s.logger.Error("Fehler beim Schließen der Client-Verbindung",
				zap.Error(err),
				zap.String("serverID", client.ServerID),
				zap.String("userID", client.UserID),
			)
		}
	}
	s.clients = make(map[string]*WebRTCClient)
	s.logger.Info("WebRTC-Service erfolgreich beendet")
}

func (s *WebRTCService) OnICEConnectionStateChange(clientID string, state webrtc.ICEConnectionState) {
	if state == webrtc.ICEConnectionStateFailed || state == webrtc.ICEConnectionStateDisconnected {
		s.ClosePeerConnection(clientID)
	}
}

func (s *WebRTCService) OnConnectionStateChange(clientID string, state webrtc.PeerConnectionState) {
	if state == webrtc.PeerConnectionStateFailed || state == webrtc.PeerConnectionStateClosed {
		s.ClosePeerConnection(clientID)
	}
}
