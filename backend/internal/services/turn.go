package services

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/auraspeak/backend/internal/config"
	"github.com/pion/turn/v2"
)

type TURNService struct {
	server *turn.Server
	mu     sync.RWMutex
	config *config.Config
}

func NewTURNService(cfg *config.Config) (*TURNService, error) {
	// Erstelle UDP-Listener für TURN
	udpListener, err := net.ListenPacket("udp4", fmt.Sprintf("0.0.0.0:%d", cfg.LocalTURN.Port))
	if err != nil {
		return nil, fmt.Errorf("failed to create UDP listener: %w", err)
	}

	// Erstelle TURN-Server mit verbesserter Authentifizierung
	server, err := turn.NewServer(turn.ServerConfig{
		Realm: cfg.LocalTURN.Realm,
		AuthHandler: func(username string, realm string, srcAddr net.Addr) ([]byte, bool) {
			// Überprüfe, ob der Benutzer existiert und das Passwort korrekt ist
			if username != cfg.LocalTURN.Username {
				log.Printf("Ungültiger Benutzername: %s", username)
				return nil, false
			}

			// Generiere ein temporäres Passwort mit HMAC-SHA1
			now := time.Now().Unix()
			h := hmac.New(sha1.New, []byte(cfg.LocalTURN.Password))
			h.Write([]byte(fmt.Sprintf("%d", now)))
			tempPassword := base64.StdEncoding.EncodeToString(h.Sum(nil))

			return []byte(tempPassword), true
		},
		ListenerConfigs: []turn.ListenerConfig{
			{
				Listener: udpListener,
				RelayProtocols: []turn.Protocol{
					turn.UDP,
				},
			},
		},
		// Rate Limiting
		RateLimit: turn.RateLimit{
			MaxRequestsPerSecond: 10,
			MaxBurstSize:         20,
		},
		// Verbindungslimits
		ConnectionTimeout: 30 * time.Second,
		MaxConnections:    1000,
		// Sicherheitseinstellungen
		AllowLoopback: false, // Verhindert Verbindungen von localhost
		NoAuth:        false, // Erfordert immer Authentifizierung
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create TURN server: %w", err)
	}

	log.Printf("TURN Server gestartet auf %s:%d", cfg.LocalTURN.PublicIP, cfg.LocalTURN.Port)
	return &TURNService{
		server: server,
		config: cfg,
	}, nil
}

func (s *TURNService) Start() error {
	return s.server.Start()
}

func (s *TURNService) Stop() error {
	return s.server.Close()
}

func (s *TURNService) GetTURNConfig() turn.ServerConfig {
	return s.server.Config()
}

// Generiert ein temporäres Passwort für die TURN-Authentifizierung
func (s *TURNService) GenerateTemporaryPassword() string {
	now := time.Now().Unix()
	h := hmac.New(sha1.New, []byte(s.config.LocalTURN.Password))
	h.Write([]byte(fmt.Sprintf("%d", now)))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}
