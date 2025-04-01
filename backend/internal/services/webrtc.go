package services

import (
	"sync"

	"github.com/pion/webrtc/v3"
)

type WebRTCService struct {
	api *webrtc.API
	mu  sync.RWMutex
	// channelID -> []*webrtc.PeerConnection
	connections map[uint][]*webrtc.PeerConnection
}

func NewWebRTCService() *WebRTCService {
	api := webrtc.NewAPI(webrtc.WithSettingEngine(webrtc.SettingEngine{}))

	return &WebRTCService{
		api:         api,
		connections: make(map[uint][]*webrtc.PeerConnection),
	}
}

type OfferRequest struct {
	ChannelID uint   `json:"channelId"`
	SDP       string `json:"sdp"`
}

type AnswerRequest struct {
	ChannelID uint   `json:"channelId"`
	SDP       string `json:"sdp"`
}

type ICECandidateRequest struct {
	ChannelID uint   `json:"channelId"`
	Candidate string `json:"candidate"`
}

func (s *WebRTCService) CreateOffer(req OfferRequest) (*webrtc.SessionDescription, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pc, err := s.api.NewPeerConnection(webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	})
	if err != nil {
		return nil, err
	}

	// Add audio track
	audioTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "audio/opus"}, "audio", "pion")
	if err != nil {
		return nil, err
	}

	_, err = pc.AddTrack(audioTrack)
	if err != nil {
		return nil, err
	}

	// Store connection
	s.connections[req.ChannelID] = append(s.connections[req.ChannelID], pc)

	// Create offer
	offer, err := pc.CreateOffer(nil)
	if err != nil {
		return nil, err
	}

	err = pc.SetLocalDescription(offer)
	if err != nil {
		return nil, err
	}

	return &offer, nil
}

func (s *WebRTCService) CreateAnswer(req OfferRequest) (*webrtc.SessionDescription, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	pc, err := s.api.NewPeerConnection(webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	})
	if err != nil {
		return nil, err
	}

	// Add audio track
	audioTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "audio/opus"}, "audio", "pion")
	if err != nil {
		return nil, err
	}

	_, err = pc.AddTrack(audioTrack)
	if err != nil {
		return nil, err
	}

	// Store connection
	s.connections[req.ChannelID] = append(s.connections[req.ChannelID], pc)

	// Set remote description
	err = pc.SetRemoteDescription(webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  req.SDP,
	})
	if err != nil {
		return nil, err
	}

	// Create answer
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		return nil, err
	}

	err = pc.SetLocalDescription(answer)
	if err != nil {
		return nil, err
	}

	return &answer, nil
}

func (s *WebRTCService) AddICECandidate(req ICECandidateRequest) error {
	s.mu.RLock()
	connections := s.connections[req.ChannelID]
	s.mu.RUnlock()

	for _, pc := range connections {
		err := pc.AddICECandidate(webrtc.ICECandidateInit{
			Candidate: req.Candidate,
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func (s *WebRTCService) CloseConnection(channelID uint) {
	s.mu.Lock()
	defer s.mu.Unlock()

	connections := s.connections[channelID]
	for _, pc := range connections {
		pc.Close()
	}
	delete(s.connections, channelID)
}
