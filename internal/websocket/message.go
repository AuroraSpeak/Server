package websocket

import (
	"time"
)

// Nachrichtentypen
const (
	MessageTypeText         = "text"
	MessageTypeImage        = "image"
	MessageTypeFile         = "file"
	MessageTypeReaction     = "reaction"
	MessageTypeDelete       = "delete"
	MessageTypeEdit         = "edit"
	MessageTypeTyping       = "typing"
	MessageTypeUserJoined   = "user_joined"
	MessageTypeUserLeft     = "user_left"
	MessageTypeError        = "error"
	MessageTypePing         = "ping"
	MessageTypePong         = "pong"
	MessageTypeCallRequest  = "call_request"
	MessageTypeOffer        = "offer"
	MessageTypeAnswer       = "answer"
	MessageTypeIceCandidate = "ice_candidate"
)

// Message repräsentiert eine WebSocket-Nachricht
type Message struct {
	Type         string                 `json:"type"`
	ID           uint                   `json:"id,omitempty"`
	Content      string                 `json:"content,omitempty"`
	UserID       uint                   `json:"userId,omitempty"`
	TargetUserID string                 `json:"targetUserId,omitempty"`
	RoomID       string                 `json:"roomId,omitempty"`
	ChannelID    string                 `json:"channelId"`
	Username     string                 `json:"username,omitempty"`
	CreatedAt    time.Time              `json:"createdAt,omitempty"`
	UpdatedAt    time.Time              `json:"updatedAt,omitempty"`
	Attachments  []Attachment           `json:"attachments,omitempty"`
	Reactions    []Reaction             `json:"reactions,omitempty"`
	Error        string                 `json:"error,omitempty"`
	Data         map[string]interface{} `json:"data,omitempty"`
}

// Attachment repräsentiert einen Dateianhang
type Attachment struct {
	ID       uint   `json:"id"`
	FileName string `json:"fileName"`
	FileType string `json:"fileType"`
	FileSize int64  `json:"fileSize"`
	FilePath string `json:"filePath"`
}

// Reaction repräsentiert eine Reaktion auf eine Nachricht
type Reaction struct {
	Emoji     string `json:"emoji"`
	UserID    uint   `json:"userId"`
	MessageID uint   `json:"messageId"`
}

// RTCIceCandidate repräsentiert einen ICE-Kandidaten
type RTCIceCandidate struct {
	Candidate     string `json:"candidate"`
	SDPMLineIndex int    `json:"sdpMLineIndex"`
	SDPMid        string `json:"sdpMid"`
}

// RTCSessionDescription repräsentiert eine SDP-Beschreibung
type RTCSessionDescription struct {
	Type string `json:"type"` // "offer" oder "answer"
	SDP  string `json:"sdp"`
}
