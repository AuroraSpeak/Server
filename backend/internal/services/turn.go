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

	"github.com/auraspeak/backend/internal/types"
	"github.com/pion/turn/v2"
)

type TURNService struct {
	server *turn.Server
	mu     sync.RWMutex
	config *types.Config
}

func NewTURNService(cfg *types.Config) (*TURNService, error) {
	// Erstelle UDP-Listener für TURN
	tcpListener, err := net.Listen("tcp4", fmt.Sprintf("0.0.0.0:%d", cfg.LocalTURN.Port))
	if err != nil {
		return nil, fmt.Errorf("failed to create TCP listener: %w", err)
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
				Listener: tcpListener,
				RelayAddressGenerator: &turn.RelayAddressGeneratorStatic{
					RelayAddress: net.ParseIP(cfg.LocalTURN.PublicIP),
					Address:      "0.0.0.0",
				},
			},
		},
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
	// Der Server startet automatisch bei der Erstellung
	return nil
}

func (s *TURNService) Stop() error {
	return s.server.Close()
}

// Generiert ein temporäres Passwort für die TURN-Authentifizierung
func (s *TURNService) GenerateTemporaryPassword() string {
	now := time.Now().Unix()
	h := hmac.New(sha1.New, []byte(s.config.LocalTURN.Password))
	h.Write([]byte(fmt.Sprintf("%d", now)))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}
