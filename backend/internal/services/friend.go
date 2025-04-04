package services

import (
	"errors"
	"time"

	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type FriendService struct {
	db *gorm.DB
}

func NewFriendService(db *gorm.DB) *FriendService {
	return &FriendService{db: db}
}

func (s *FriendService) GetFriends(userID uint) ([]models.User, error) {
	var friends []models.User
	err := s.db.Joins("JOIN friends ON friends.friend_id = users.id").
		Where("friends.user_id = ?", userID).
		Find(&friends).Error
	return friends, err
}

func (s *FriendService) GetFriendRequests(userID uint) ([]models.FriendRequest, error) {
	var requests []models.FriendRequest
	err := s.db.Where("to_id = ? AND status = ?", userID, "pending").
		Find(&requests).Error
	return requests, err
}

func (s *FriendService) SendFriendRequest(fromID, toID uint) error {
	// Überprüfe, ob bereits eine Freundschaft oder Anfrage existiert
	var count int64
	s.db.Model(&models.Friend{}).Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", fromID, toID, toID, fromID).Count(&count)
	if count > 0 {
		return errors.New("Freundschaft existiert bereits")
	}

	s.db.Model(&models.FriendRequest{}).Where("(from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)", fromID, toID, toID, fromID).Count(&count)
	if count > 0 {
		return errors.New("Anfrage existiert bereits")
	}

	request := models.FriendRequest{
		FromID:    fromID,
		ToID:      toID,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return s.db.Create(&request).Error
}

func (s *FriendService) AcceptFriendRequest(requestID uint) error {
	var request models.FriendRequest
	if err := s.db.First(&request, requestID).Error; err != nil {
		return err
	}

	// Beginne Transaktion
	tx := s.db.Begin()

	// Aktualisiere Anfrage-Status
	if err := tx.Model(&request).Update("status", "accepted").Error; err != nil {
		tx.Rollback()
		return err
	}

	// Erstelle Freundschaft in beide Richtungen
	friendship1 := models.Friend{
		UserID:    request.FromID,
		FriendID:  request.ToID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	friendship2 := models.Friend{
		UserID:    request.ToID,
		FriendID:  request.FromID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := tx.Create(&friendship1).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Create(&friendship2).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (s *FriendService) RejectFriendRequest(requestID uint) error {
	return s.db.Model(&models.FriendRequest{}).Where("id = ?", requestID).Update("status", "rejected").Error
}

func (s *FriendService) RemoveFriend(userID, friendID uint) error {
	// Beginne Transaktion
	tx := s.db.Begin()

	// Lösche Freundschaft in beide Richtungen
	if err := tx.Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)", userID, friendID, friendID, userID).Delete(&models.Friend{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
