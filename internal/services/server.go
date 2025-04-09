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
	err := s.db.Create(server).Error
	if err == nil && s.cache != nil {
		// Cache für Server-Listen invalidieren
		s.cache.InvalidateByPattern("user_servers:*")
	}

	// Füge den Ersteller als Mitglied mit der Rolle "owner" hinzu
	if err == nil {
		member := &models.Member{
			UserID:   server.OwnerID,
			ServerID: server.ID,
			Role:     models.MemberRoleOwner,
		}
		err = s.db.Create(member).Error
	}

	return err
}

func (s *ServerService) GetServer(id uint) (*models.Server, error) {
	if s.cache == nil {
		return s.getServerFromDB(id)
	}

	cacheKey := fmt.Sprintf("server:%d", id)
	var server models.Server

	err := s.cache.GetOrSet(cacheKey, &server, 5*time.Minute, func() (interface{}, error) {
		return s.getServerFromDB(id)
	})

	if err != nil {
		return nil, err
	}
	return &server, nil
}

func (s *ServerService) getServerFromDB(id uint) (*models.Server, error) {
	var server models.Server
	err := s.db.Preload("Members").Preload("Channels").First(&server, id).Error
	if err != nil {
		return nil, err
	}
	return &server, nil
}

func (s *ServerService) GetUserServers(userID uint) ([]models.Server, error) {
	if s.cache == nil {
		return s.getUserServersFromDB(userID)
	}

	cacheKey := fmt.Sprintf("user_servers:%d", userID)
	var servers []models.Server

	err := s.cache.GetOrSet(cacheKey, &servers, 5*time.Minute, func() (interface{}, error) {
		return s.getUserServersFromDB(userID)
	})

	if err != nil {
		return nil, err
	}
	return servers, nil
}

func (s *ServerService) getUserServersFromDB(userID uint) ([]models.Server, error) {
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
	err := s.db.Model(&models.Server{}).Where("id = ?", id).Updates(updates).Error
	if err == nil && s.cache != nil {
		// Cache für diesen Server und Server-Listen invalidieren
		s.cache.Delete(fmt.Sprintf("server:%d", id))
		s.cache.InvalidateByPattern("user_servers:*")
	}
	return err
}

func (s *ServerService) DeleteServer(id uint) error {
	err := s.db.Delete(&models.Server{}, id).Error
	if err == nil && s.cache != nil {
		// Cache für diesen Server und Server-Listen invalidieren
		s.cache.Delete(fmt.Sprintf("server:%d", id))
		s.cache.InvalidateByPattern("user_servers:*")
	}
	return err
}

func (s *ServerService) IsMember(serverID, userID uint) (bool, error) {
	if s.cache == nil {
		return s.isMemberFromDB(serverID, userID)
	}

	cacheKey := fmt.Sprintf("server_member:%d:%d", serverID, userID)
	var isMember bool

	err := s.cache.GetOrSet(cacheKey, &isMember, 5*time.Minute, func() (interface{}, error) {
		return s.isMemberFromDB(serverID, userID)
	})

	if err != nil {
		return false, err
	}
	return isMember, nil
}

func (s *ServerService) isMemberFromDB(serverID, userID uint) (bool, error) {
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
	err := s.db.Create(member).Error
	if err == nil && s.cache != nil {
		// Cache für Server-Mitglieder und Server-Listen invalidieren
		s.cache.Delete(fmt.Sprintf("server:%d", serverID))
		s.cache.Delete(fmt.Sprintf("server_members:%d", serverID))
		s.cache.Delete(fmt.Sprintf("server_member:%d:%d", serverID, userID))
		s.cache.InvalidateByPattern("user_servers:*")
	}
	return err
}

func (s *ServerService) RemoveMember(serverID, userID uint) error {
	err := s.db.Where("server_id = ? AND user_id = ?", serverID, userID).Delete(&models.Member{}).Error
	if err == nil && s.cache != nil {
		// Cache für Server-Mitglieder und Server-Listen invalidieren
		s.cache.Delete(fmt.Sprintf("server:%d", serverID))
		s.cache.Delete(fmt.Sprintf("server_members:%d", serverID))
		s.cache.Delete(fmt.Sprintf("server_member:%d:%d", serverID, userID))
		s.cache.InvalidateByPattern("user_servers:*")
	}
	return err
}

func (s *ServerService) GetServerMembers(serverID uint) ([]models.User, error) {
	if s.cache == nil {
		return s.getServerMembersFromDB(serverID)
	}

	cacheKey := fmt.Sprintf("server_members:%d", serverID)
	var users []models.User

	err := s.cache.GetOrSet(cacheKey, &users, 5*time.Minute, func() (interface{}, error) {
		return s.getServerMembersFromDB(serverID)
	})

	if err != nil {
		return nil, err
	}
	return users, nil
}

func (s *ServerService) getServerMembersFromDB(serverID uint) ([]models.User, error) {
	var users []models.User
	if err := s.db.Joins("JOIN members ON members.user_id = users.id").
		Where("members.server_id = ?", serverID).
		Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (s *ServerService) HasPermission(serverID uint, userID uint, requiredRole models.MemberRole) (bool, error) {
	if s.cache == nil {
		return s.hasPermissionFromDB(serverID, userID, requiredRole)
	}

	cacheKey := fmt.Sprintf("server_permission:%d:%d:%s", serverID, userID, requiredRole)
	var hasPermission bool

	err := s.cache.GetOrSet(cacheKey, &hasPermission, 5*time.Minute, func() (interface{}, error) {
		return s.hasPermissionFromDB(serverID, userID, requiredRole)
	})

	if err != nil {
		return false, err
	}
	return hasPermission, nil
}

func (s *ServerService) hasPermissionFromDB(serverID uint, userID uint, requiredRole models.MemberRole) (bool, error) {
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
	if s.cache == nil {
		return s.getChannelFromDB(id)
	}

	cacheKey := fmt.Sprintf("channel:%d", id)
	var channel models.Channel

	err := s.cache.GetOrSet(cacheKey, &channel, 5*time.Minute, func() (interface{}, error) {
		return s.getChannelFromDB(id)
	})

	if err != nil {
		return nil, err
	}
	return &channel, nil
}

func (s *ServerService) getChannelFromDB(id uint) (*models.Channel, error) {
	var channel models.Channel
	err := s.db.First(&channel, id).Error
	if err != nil {
		return nil, err
	}
	return &channel, nil
}

func (s *ServerService) GetServerStats(id uint) (*models.ServerStats, error) {
	if s.cache == nil {
		return s.generateServerStats()
	}

	cacheKey := fmt.Sprintf("server_stats:%d", id)
	var stats models.ServerStats

	err := s.cache.GetOrSet(cacheKey, &stats, 30*time.Second, func() (interface{}, error) {
		return s.generateServerStats()
	})

	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func (s *ServerService) generateServerStats() (*models.ServerStats, error) {
	// Generiere neue Statistiken
	stats := models.ServerStats{
		CPU:    45.5,
		Memory: 60.2,
		Disk:   75.8,
		Uptime: 3600,
	}
	return &stats, nil
}

func (s *ServerService) GetMemberRole(serverID uint, userID uint) (string, error) {
	// Hole die Server-Mitgliedschaft
	var member models.Member
	if err := s.db.Where("server_id = ? AND user_id = ?", serverID, userID).First(&member).Error; err != nil {
		return "", err
	}

	return string(member.Role), nil
}
