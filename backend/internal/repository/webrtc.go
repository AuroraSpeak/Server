package repository

import (
	"time"

	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type WebRTCRepository struct {
	db *gorm.DB
}

func NewWebRTCRepository(db *gorm.DB) *WebRTCRepository {
	return &WebRTCRepository{
		db: db,
	}
}

func (r *WebRTCRepository) CreateConnection(conn *models.WebRTCConnection) error {
	return r.db.Create(conn).Error
}

func (r *WebRTCRepository) GetConnection(id string) (*models.WebRTCConnection, error) {
	var conn models.WebRTCConnection
	err := r.db.First(&conn, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &conn, nil
}

func (r *WebRTCRepository) UpdateConnection(conn *models.WebRTCConnection) error {
	return r.db.Save(conn).Error
}

func (r *WebRTCRepository) DeleteConnection(id string) error {
	return r.db.Delete(&models.WebRTCConnection{}, "id = ?", id).Error
}

func (r *WebRTCRepository) CreateSession(session *models.WebRTCSession) error {
	return r.db.Create(session).Error
}

func (r *WebRTCRepository) GetSession(connectionID string) (*models.WebRTCSession, error) {
	var session models.WebRTCSession
	err := r.db.First(&session, "connection_id = ?", connectionID).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *WebRTCRepository) UpdateSession(session *models.WebRTCSession) error {
	return r.db.Save(session).Error
}

func (r *WebRTCRepository) DeleteSession(connectionID string) error {
	return r.db.Delete(&models.WebRTCSession{}, "connection_id = ?", connectionID).Error
}

func (r *WebRTCRepository) CreateICECandidate(candidate *models.WebRTCICECandidate) error {
	return r.db.Create(candidate).Error
}

func (r *WebRTCRepository) GetICECandidates(connectionID string) ([]*models.WebRTCICECandidate, error) {
	var candidates []*models.WebRTCICECandidate
	err := r.db.Where("connection_id = ?", connectionID).Find(&candidates).Error
	if err != nil {
		return nil, err
	}
	return candidates, nil
}

func (r *WebRTCRepository) DeleteICECandidates(connectionID string) error {
	return r.db.Delete(&models.WebRTCICECandidate{}, "connection_id = ?", connectionID).Error
}

func (r *WebRTCRepository) CleanupInactiveConnections(timeout time.Duration) error {
	cutoff := time.Now().Add(-timeout)
	return r.db.Where("last_activity < ?", cutoff).Delete(&models.WebRTCConnection{}).Error
}

func (r *WebRTCRepository) GetActiveConnections() ([]*models.WebRTCConnection, error) {
	var connections []*models.WebRTCConnection
	err := r.db.Where("deleted_at IS NULL").Find(&connections).Error
	if err != nil {
		return nil, err
	}
	return connections, nil
}

func (r *WebRTCRepository) GetConnectionsByServerID(serverID string) ([]*models.WebRTCConnection, error) {
	var connections []*models.WebRTCConnection
	err := r.db.Where("server_id = ? AND deleted_at IS NULL", serverID).Find(&connections).Error
	if err != nil {
		return nil, err
	}
	return connections, nil
}

func (r *WebRTCRepository) GetConnectionsByUserID(userID string) ([]*models.WebRTCConnection, error) {
	var connections []*models.WebRTCConnection
	err := r.db.Where("user_id = ? AND deleted_at IS NULL", userID).Find(&connections).Error
	if err != nil {
		return nil, err
	}
	return connections, nil
}

func (r *WebRTCRepository) GetConnectionsByClientID(clientID string) ([]*models.WebRTCConnection, error) {
	var connections []*models.WebRTCConnection
	err := r.db.Where("client_id = ? AND deleted_at IS NULL", clientID).Find(&connections).Error
	if err != nil {
		return nil, err
	}
	return connections, nil
}
