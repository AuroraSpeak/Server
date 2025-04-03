package services

import (
	"fmt"
	"time"

	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type ServerService struct {
	db    *gorm.DB
	cache *CacheService
}

func NewServerService(db *gorm.DB, cache *CacheService) *ServerService {
	return &ServerService{
		db:    db,
		cache: cache,
	}
}

func (s *ServerService) CreateServer(server *models.Server) error {
	return s.db.Create(server).Error
}

func (s *ServerService) GetServer(id uint) (*models.Server, error) {
	var server models.Server
	err := s.db.Preload("Members").Preload("Channels").First(&server, id).Error
	if err != nil {
		return nil, err
	}
	return &server, nil
}

func (s *ServerService) GetUserServers(userID uint) ([]models.Server, error) {
	var servers []models.Server
	err := s.db.Joins("JOIN members ON members.server_id = servers.id").
		Where("members.user_id = ?", userID).
		Preload("Members").
		Preload("Channels").
		Find(&servers).Error
	if err != nil {
		return nil, err
	}
	return servers, nil
}

func (s *ServerService) UpdateServer(id uint, updates map[string]interface{}) error {
	return s.db.Model(&models.Server{}).Where("id = ?", id).Updates(updates).Error
}

func (s *ServerService) DeleteServer(id uint) error {
	return s.db.Delete(&models.Server{}, id).Error
}

func (s *ServerService) IsMember(serverID, userID uint) (bool, error) {
	var count int64
	err := s.db.Model(&models.Member{}).Where("server_id = ? AND user_id = ?", serverID, userID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (s *ServerService) AddMember(serverID, userID uint) error {
	member := &models.Member{
		UserID:   userID,
		ServerID: serverID,
	}
	return s.db.Create(member).Error
}

func (s *ServerService) RemoveMember(serverID, userID uint) error {
	return s.db.Where("server_id = ? AND user_id = ?", serverID, userID).Delete(&models.Member{}).Error
}

func (s *ServerService) GetServerMembers(serverID uint) ([]models.User, error) {
	// Versuche zuerst aus dem Cache zu lesen
	cacheKey := fmt.Sprintf("server_members:%d", serverID)
	var users []models.User
	if err := s.cache.Get(cacheKey, &users); err == nil {
		return users, nil
	}

	// Wenn nicht im Cache, aus der Datenbank lesen
	if err := s.db.Joins("JOIN members ON members.user_id = users.id").
		Where("members.server_id = ?", serverID).
		Find(&users).Error; err != nil {
		return nil, err
	}

	// Im Cache speichern
	s.cache.Set(cacheKey, users, 5*time.Minute)
	return users, nil
}

func (s *ServerService) HasPermission(serverID uint, userID uint, requiredRole models.MemberRole) (bool, error) {
	var member models.Member
	err := s.db.Where("server_id = ? AND user_id = ?", serverID, userID).First(&member).Error
	if err != nil {
		return false, err
	}

	switch member.Role {
	case models.MemberRoleOwner:
		return true, nil
	case models.MemberRoleAdmin:
		return requiredRole != models.MemberRoleOwner, nil
	default:
		return requiredRole == models.MemberRoleMember, nil
	}
}

func (s *ServerService) GetChannel(id uint) (*models.Channel, error) {
	// Versuche zuerst aus dem Cache zu lesen
	cacheKey := fmt.Sprintf("channel:%d", id)
	var channel models.Channel
	if err := s.cache.Get(cacheKey, &channel); err == nil {
		return &channel, nil
	}

	// Wenn nicht im Cache, aus der Datenbank lesen
	err := s.db.First(&channel, id).Error
	if err != nil {
		return nil, err
	}

	// Im Cache speichern
	s.cache.Set(cacheKey, channel, 5*time.Minute)
	return &channel, nil
}

func (s *ServerService) GetServerStats(id uint) (*models.ServerStats, error) {
	// Generiere neue Statistiken
	stats := models.ServerStats{
		CPU:    45.5,
		Memory: 60.2,
		Disk:   75.8,
		Uptime: 3600,
	}

	// Versuche im Cache zu speichern, ignoriere Fehler
	if s.cache != nil {
		cacheKey := fmt.Sprintf("server_stats:%d", id)
		s.cache.Set(cacheKey, stats, 30*time.Second)
	}

	return &stats, nil
}
