package models

import (
	"strconv"
	"strings"
	"time"

	"github.com/pion/webrtc/v3"
)

type WebRTCConnection struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	ClientID     string    `json:"clientId" gorm:"not null"`
	ServerID     string    `json:"serverId" gorm:"not null"`
	UserID       string    `json:"userId" gorm:"not null"`
	ConnectionID string    `json:"connectionId" gorm:"not null"`
	State        string    `json:"state" gorm:"not null"`
	LastActivity time.Time `json:"lastActivity" gorm:"not null"`
	CreatedAt    time.Time `json:"createdAt" gorm:"not null"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"not null"`
	DeletedAt    time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

type WebRTCSession struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	ConnectionID string    `json:"connectionId" gorm:"not null"`
	Offer        string    `json:"offer" gorm:"type:text"`
	Answer       string    `json:"answer" gorm:"type:text"`
	CreatedAt    time.Time `json:"createdAt" gorm:"not null"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"not null"`
	DeletedAt    time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

type WebRTCICECandidate struct {
	ID               string    `json:"id" gorm:"primaryKey"`
	ConnectionID     string    `json:"connectionId" gorm:"not null"`
	Candidate        string    `json:"candidate" gorm:"type:text"`
	SDPMid           string    `json:"sdpMid"`
	SDPMLineIndex    uint16    `json:"sdpMLineIndex"`
	UsernameFragment string    `json:"usernameFragment"`
	CreatedAt        time.Time `json:"createdAt" gorm:"not null"`
	UpdatedAt        time.Time `json:"updatedAt" gorm:"not null"`
	DeletedAt        time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

type WebRTCMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

type WebRTCConnectionState struct {
	ConnectionID string    `json:"connectionId"`
	State        string    `json:"state"`
	LastActivity time.Time `json:"lastActivity"`
}

func NewWebRTCConnection(clientID, serverID, userID, connectionID string) *WebRTCConnection {
	now := time.Now()
	return &WebRTCConnection{
		ID:           connectionID,
		ClientID:     clientID,
		ServerID:     serverID,
		UserID:       userID,
		ConnectionID: connectionID,
		State:        "initializing",
		LastActivity: now,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

func NewWebRTCSession(connectionID string, offer *webrtc.SessionDescription) *WebRTCSession {
	now := time.Now()
	return &WebRTCSession{
		ID:           connectionID,
		ConnectionID: connectionID,
		Offer:        offer.SDP,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

func NewWebRTCICECandidate(connectionID string, candidate *webrtc.ICECandidate) *WebRTCICECandidate {
	candidateStr := candidate.String()
	parts := strings.Split(candidateStr, " ")
	if len(parts) < 3 {
		return nil
	}

	sdpMLineIndex, err := strconv.ParseUint(parts[1], 10, 16)
	if err != nil {
		return nil
	}

	return &WebRTCICECandidate{
		ConnectionID:     connectionID,
		Candidate:        candidateStr,
		SDPMid:           parts[0],
		SDPMLineIndex:    uint16(sdpMLineIndex),
		UsernameFragment: parts[2],
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
}

func (c *WebRTCConnection) UpdateState(state string) {
	c.State = state
	c.LastActivity = time.Now()
	c.UpdatedAt = time.Now()
}

func (c *WebRTCConnection) UpdateActivity() {
	c.LastActivity = time.Now()
	c.UpdatedAt = time.Now()
}

func (s *WebRTCSession) SetAnswer(answer *webrtc.SessionDescription) {
	s.Answer = answer.SDP
	s.UpdatedAt = time.Now()
}
