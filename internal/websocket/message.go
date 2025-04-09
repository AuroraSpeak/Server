package websocket

// MessageType definiert die möglichen Nachrichtentypen
type MessageType string

const (
	MessageTypeCallRequest  MessageType = "call-request"
	MessageTypeOffer        MessageType = "offer"
	MessageTypeAnswer       MessageType = "answer"
	MessageTypeIceCandidate MessageType = "ice-candidate"
	MessageTypePing         MessageType = "ping"
	MessageTypePong         MessageType = "pong"
)

// Message repräsentiert eine WebSocket-Nachricht
type Message struct {
	Type         MessageType `json:"type"`
	TargetUserID string      `json:"targetUserId,omitempty"`
	Data         interface{} `json:"data,omitempty"`
	RoomID       string      `json:"roomId,omitempty"`
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
