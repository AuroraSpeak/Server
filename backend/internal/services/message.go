package services

import (
	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type MessageService struct {
	db *gorm.DB
}

func NewMessageService(db *gorm.DB) *MessageService {
	return &MessageService{db: db}
}

func (s *MessageService) CreateMessage(message *models.Message) error {
	return s.db.Create(message).Error
}

func (s *MessageService) GetMessage(id uint) (*models.Message, error) {
	var message models.Message
	err := s.db.Preload("User").First(&message, id).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (s *MessageService) GetChannelMessages(channelID uint, limit int) ([]models.Message, error) {
	var messages []models.Message
	err := s.db.Where("channel_id = ?", channelID).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Find(&messages).Error
	if err != nil {
		return nil, err
	}
	return messages, nil
}

func (s *MessageService) UpdateMessage(id uint, updates map[string]interface{}) error {
	return s.db.Model(&models.Message{}).Where("id = ?", id).Updates(updates).Error
}

func (s *MessageService) DeleteMessage(id uint) error {
	return s.db.Delete(&models.Message{}, id).Error
}

func (s *MessageService) GetChannel(channelID uint) (*models.Channel, error) {
	var channel models.Channel
	err := s.db.First(&channel, channelID).Error
	if err != nil {
		return nil, err
	}
	return &channel, nil
} 