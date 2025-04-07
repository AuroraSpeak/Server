package services

import (
	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type ChannelService struct {
	db *gorm.DB
}

func NewChannelService(db *gorm.DB) *ChannelService {
	return &ChannelService{db: db}
}

func (s *ChannelService) CreateChannel(channel *models.Channel) error {
	return s.db.Create(channel).Error
}

func (s *ChannelService) GetChannel(id uint) (*models.Channel, error) {
	var channel models.Channel
	err := s.db.Preload("Messages").First(&channel, id).Error
	if err != nil {
		return nil, err
	}
	return &channel, nil
}

func (s *ChannelService) GetServerChannels(serverID uint) ([]models.Channel, error) {
	var channels []models.Channel
	err := s.db.Where("server_id = ?", serverID).Preload("Messages").Find(&channels).Error
	if err != nil {
		return nil, err
	}
	return channels, nil
}

func (s *ChannelService) UpdateChannel(id uint, updates map[string]interface{}) error {
	return s.db.Model(&models.Channel{}).Where("id = ?", id).Updates(updates).Error
}

func (s *ChannelService) DeleteChannel(id uint) error {
	return s.db.Delete(&models.Channel{}, id).Error
} 