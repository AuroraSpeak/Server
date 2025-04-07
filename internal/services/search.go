package services

import (
	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type SearchService struct {
	db *gorm.DB
}

func NewSearchService(db *gorm.DB) *SearchService {
	return &SearchService{db: db}
}

type SearchResult struct {
	Users    []models.User    `json:"users"`
	Servers  []models.Server  `json:"servers"`
	Channels []models.Channel `json:"channels"`
	Messages []models.Message `json:"messages"`
}

func (s *SearchService) Search(query string) (*SearchResult, error) {
	result := &SearchResult{}

	// Suche nach Benutzern
	if err := s.db.Where("username LIKE ? OR email LIKE ?", "%"+query+"%", "%"+query+"%").Find(&result.Users).Error; err != nil {
		return nil, err
	}

	// Suche nach Servern
	if err := s.db.Where("name LIKE ? OR description LIKE ?", "%"+query+"%", "%"+query+"%").Find(&result.Servers).Error; err != nil {
		return nil, err
	}

	// Suche nach Kanälen
	if err := s.db.Where("name LIKE ? OR description LIKE ?", "%"+query+"%", "%"+query+"%").Find(&result.Channels).Error; err != nil {
		return nil, err
	}

	// Suche nach Nachrichten
	if err := s.db.Where("content LIKE ?", "%"+query+"%").Find(&result.Messages).Error; err != nil {
		return nil, err
	}

	return result, nil
}
