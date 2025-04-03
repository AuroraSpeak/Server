package config

import (
	"github.com/pion/webrtc/v3"
)

type WebRTCConfig struct {
	ICEServers []webrtc.ICEServer
}

func NewWebRTCConfig() *WebRTCConfig {
	return &WebRTCConfig{
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
	}
}

func (c *WebRTCConfig) GetWebRTCConfiguration() webrtc.Configuration {
	return webrtc.Configuration{
		ICEServers:           c.ICEServers,
		ICETransportPolicy:   webrtc.ICETransportPolicyAll,
		BundlePolicy:         webrtc.BundlePolicyMaxBundle,
		RTCPMuxPolicy:        webrtc.RTCPMuxPolicyRequire,
		ICECandidatePoolSize: 10,
	}
}

func (c *WebRTCConfig) AddICEServer(server webrtc.ICEServer) {
	c.ICEServers = append(c.ICEServers, server)
}

func (c *WebRTCConfig) ClearICEServers() {
	c.ICEServers = make([]webrtc.ICEServer, 0)
}
