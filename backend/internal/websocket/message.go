package websocket

// Message repräsentiert eine WebSocket-Nachricht
type Message struct {
	Type         string      `json:"type"`
	TargetUserID string      `json:"targetUserId,omitempty"`
	Data         interface{} `json:"data,omitempty"`
}
