package services

import (
	"errors"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type ServerSettingsService struct {
	db      *gorm.DB
	baseDir string
}

func NewServerSettingsService(db *gorm.DB, baseDir string) *ServerSettingsService {
	return &ServerSettingsService{
		db:      db,
		baseDir: baseDir,
	}
}

func (s *ServerSettingsService) GetSettings(serverID uint) (*models.ServerSettings, error) {
	var settings models.ServerSettings
	err := s.db.Where("server_id = ?", serverID).First(&settings).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Erstelle Standard-Einstellungen
			settings = models.ServerSettings{
				ServerID:       serverID,
				Name:           "",
				Description:    "",
				IconURL:        "",
				BannerURL:      "",
				DefaultChannel: 0,
				DefaultRole:    1, // Standard-Rolle
				Verification:   false,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			if err := s.db.Create(&settings).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	return &settings, nil
}

func (s *ServerSettingsService) UpdateSettings(serverID uint, updates *models.ServerSettings) error {
	updates.UpdatedAt = time.Now()
	return s.db.Model(&models.ServerSettings{}).Where("server_id = ?", serverID).Updates(updates).Error
}

func (s *ServerSettingsService) UpdateIcon(serverID uint, file *multipart.FileHeader) error {
	// Öffne die Datei
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	// Erstelle das Verzeichnis, falls es nicht existiert
	dir := filepath.Join(s.baseDir, "uploads", "servers", string(serverID))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Erstelle die Zieldatei
	dstPath := filepath.Join(dir, "icon"+filepath.Ext(file.Filename))
	dst, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dst.Close()

	// Kopiere die Datei
	if _, err := io.Copy(dst, src); err != nil {
		return err
	}

	// Aktualisiere die URL in der Datenbank
	iconURL := "/uploads/servers/" + string(serverID) + "/icon" + filepath.Ext(file.Filename)
	return s.db.Model(&models.ServerSettings{}).Where("server_id = ?", serverID).Update("icon_url", iconURL).Error
}
