package services

import (
	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/repository"
)

type ChannelSettingsService struct {
	repo *repository.ChannelSettingsRepository
}

func NewChannelSettingsService(repo *repository.ChannelSettingsRepository) *ChannelSettingsService {
	return &ChannelSettingsService{repo: repo}
}

func (s *ChannelSettingsService) GetSettings(channelID string) (*models.ChannelSettings, error) {
	return s.repo.GetSettings(channelID)
}

func (s *ChannelSettingsService) UpdateSettings(channelID string, updates *models.ChannelSettings) error {
	return s.repo.UpdateSettings(channelID, updates)
}

func (s *ChannelSettingsService) GetPermissionOverwrites(channelID string) ([]models.PermissionOverwrite, error) {
	return s.repo.GetPermissionOverwrites(channelID)
}

func (s *ChannelSettingsService) UpdatePermissionOverwrite(overwriteID string, updates *models.PermissionOverwrite) error {
	return s.repo.UpdatePermissionOverwrite(overwriteID, updates)
}

func (s *ChannelSettingsService) DeletePermissionOverwrite(overwriteID string) error {
	return s.repo.DeletePermissionOverwrite(overwriteID)
}

func (s *ChannelSettingsService) CreatePermissionOverwrite(overwrite *models.PermissionOverwrite) error {
	return s.repo.CreatePermissionOverwrite(overwrite)
}
