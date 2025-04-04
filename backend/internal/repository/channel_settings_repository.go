package repository

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/auraspeak/backend/internal/models"

	"gorm.io/gorm"
)

var (
	ErrInvalidID = errors.New("ungültige ID")
	ErrNotFound  = errors.New("nicht gefunden")
)

type ChannelSettingsRepository struct {
	db *gorm.DB
}

func NewChannelSettingsRepository(db *gorm.DB) *ChannelSettingsRepository {
	return &ChannelSettingsRepository{db: db}
}

func (r *ChannelSettingsRepository) GetSettings(channelID string) (*models.ChannelSettings, error) {
	id, err := strconv.ParseUint(channelID, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
	}

	var settings models.ChannelSettings
	if err := r.db.First(&settings, "id = ?", uint(id)).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("%w: channel_id=%d", ErrNotFound, id)
		}
		return nil, fmt.Errorf("Datenbankfehler: %v", err)
	}
	return &settings, nil
}

func (r *ChannelSettingsRepository) UpdateSettings(channelID string, updates *models.ChannelSettings) error {
	id, err := strconv.ParseUint(channelID, 10, 64)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidID, err)
	}

	result := r.db.Model(&models.ChannelSettings{}).Where("id = ?", uint(id)).Updates(updates)
	if result.Error != nil {
		return fmt.Errorf("Datenbankfehler: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("%w: channel_id=%d", ErrNotFound, id)
	}
	return nil
}

func (r *ChannelSettingsRepository) GetPermissionOverwrites(channelID string) ([]models.PermissionOverwrite, error) {
	id, err := strconv.ParseUint(channelID, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidID, err)
	}

	var overwrites []models.PermissionOverwrite
	if err := r.db.Where("channel_id = ?", uint(id)).Find(&overwrites).Error; err != nil {
		return nil, fmt.Errorf("Datenbankfehler: %v", err)
	}
	return overwrites, nil
}

func (r *ChannelSettingsRepository) UpdatePermissionOverwrite(overwriteID string, updates *models.PermissionOverwrite) error {
	id, err := strconv.ParseUint(overwriteID, 10, 64)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidID, err)
	}

	result := r.db.Model(&models.PermissionOverwrite{}).Where("id = ?", uint(id)).Updates(updates)
	if result.Error != nil {
		return fmt.Errorf("Datenbankfehler: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("%w: overwrite_id=%d", ErrNotFound, id)
	}
	return nil
}

func (r *ChannelSettingsRepository) DeletePermissionOverwrite(overwriteID string) error {
	id, err := strconv.ParseUint(overwriteID, 10, 64)
	if err != nil {
		return fmt.Errorf("%w: %v", ErrInvalidID, err)
	}

	result := r.db.Delete(&models.PermissionOverwrite{}, "id = ?", uint(id))
	if result.Error != nil {
		return fmt.Errorf("Datenbankfehler: %v", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("%w: overwrite_id=%d", ErrNotFound, id)
	}
	return nil
}

func (r *ChannelSettingsRepository) CreatePermissionOverwrite(overwrite *models.PermissionOverwrite) error {
	if err := r.db.Create(overwrite).Error; err != nil {
		return fmt.Errorf("Datenbankfehler: %v", err)
	}
	return nil
}
