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
	err := s.db.Preload("User").
		Preload("Attachments").
		Preload("Mentions").
		Preload("Reactions").
		First(&message, id).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (s *MessageService) GetChannelMessages(channelID uint, limit int) ([]models.Message, error) {
	var messages []models.Message
	err := s.db.Where("channel_id = ?", channelID).
		Preload("User").
		Preload("Attachments").
		Preload("Mentions").
		Preload("Reactions").
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
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Lösche zuerst alle zugehörigen Daten
		if err := tx.Where("message_id = ?", id).Delete(&models.Attachment{}).Error; err != nil {
			return err
		}
		if err := tx.Where("message_id = ?", id).Delete(&models.Reaction{}).Error; err != nil {
			return err
		}
		if err := tx.Table("message_mentions").Where("message_id = ?", id).Delete(nil).Error; err != nil {
			return err
		}
		// Lösche dann die Nachricht selbst
		return tx.Delete(&models.Message{}, id).Error
	})
}

func (s *MessageService) AddReaction(messageID uint, userID uint, emoji string) error {
	reaction := &models.Reaction{
		MessageID: messageID,
		UserID:    userID,
		Emoji:     emoji,
	}
	return s.db.Create(reaction).Error
}

func (s *MessageService) RemoveReaction(messageID uint, userID uint, emoji string) error {
	return s.db.Where("message_id = ? AND user_id = ? AND emoji = ?", messageID, userID, emoji).
		Delete(&models.Reaction{}).Error
}

func (s *MessageService) AddAttachment(attachment *models.Attachment) error {
	return s.db.Create(attachment).Error
}

func (s *MessageService) AddMention(messageID uint, userID uint) error {
	return s.db.Table("message_mentions").Create(map[string]interface{}{
		"message_id": messageID,
		"user_id":    userID,
	}).Error
}

func (s *MessageService) GetChannel(channelID uint) (*models.Channel, error) {
	var channel models.Channel
	err := s.db.First(&channel, channelID).Error
	if err != nil {
		return nil, err
	}
	return &channel, nil
}
