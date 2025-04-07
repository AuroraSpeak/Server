package types

import (
	"encoding/json"

	"github.com/pion/webrtc/v3"
)

type WebRTCConfig struct {
	ICEServers []webrtc.ICEServer
}

type OfferRequest struct {
	ClientID string          `json:"clientId"`
	SDP      json.RawMessage `json:"sdp"`
}

type ICECandidateRequest struct {
	ClientID  string          `json:"clientId"`
	Candidate json.RawMessage `json:"candidate"`
}

func NewWebRTCConfig(config *Config) *WebRTCConfig {
	iceServers := make([]webrtc.ICEServer, 0)

	// STUN Server hinzufügen
	for _, url := range config.STUNServers {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs: []string{url},
		})
	}

	// TURN Server hinzufügen
	for _, turn := range config.TURNServers {
		iceServers = append(iceServers, webrtc.ICEServer{
			URLs:       []string{turn.URL},
			Username:   turn.Username,
			Credential: turn.Password,
		})
	}

	return &WebRTCConfig{
		ICEServers: iceServers,
	}
}

func (c *WebRTCConfig) GetConfiguration() webrtc.Configuration {
	return webrtc.Configuration{
		ICEServers:           c.ICEServers,
		ICETransportPolicy:   webrtc.ICETransportPolicyAll,
		BundlePolicy:         webrtc.BundlePolicyMaxBundle,
		RTCPMuxPolicy:        webrtc.RTCPMuxPolicyRequire,
		ICECandidatePoolSize: 10,
	}
}

type WebRTCService interface {
	HandleOffer(clientID string, payload json.RawMessage) error
	HandleAnswer(clientID string, payload json.RawMessage) error
	HandleICECandidate(clientID string, payload json.RawMessage) error
	ClosePeerConnection(clientID string)
	CreateOffer(req OfferRequest) (interface{}, error)
	CreateAnswer(req OfferRequest) (interface{}, error)
	AddICECandidate(req ICECandidateRequest) error
}
