package websocket

// MessageType definiert die möglichen Nachrichtentypen
type MessageType string

const (
	MessageTypePing         MessageType = "ping"
	MessageTypePong         MessageType = "pong"
	MessageTypeCallRequest  MessageType = "call-request"
	MessageTypeOffer        MessageType = "offer"
	MessageTypeAnswer       MessageType = "answer"
	MessageTypeIceCandidate MessageType = "ice-candidate"
)

// Message repräsentiert eine WebSocket-Nachricht
type Message struct {
	Type         MessageType `json:"type"`
	ChannelID    string      `json:"channelId"`
	TargetUserID string      `json:"targetUserId,omitempty"`
	RoomID       string      `json:"roomId,omitempty"`
	Data         interface{} `json:"data,omitempty"`
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
