package services

import (
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type MediaService struct {
	db      *gorm.DB
	baseDir string
}

func NewMediaService(db *gorm.DB, baseDir string) *MediaService {
	return &MediaService{
		db:      db,
		baseDir: baseDir,
	}
}

func (s *MediaService) GetFiles(channelID uint) ([]models.MediaFile, error) {
	var files []models.MediaFile
	err := s.db.Where("channel_id = ?", channelID).Find(&files).Error
	return files, err
}

func (s *MediaService) UploadFile(channelID, userID uint, file *multipart.FileHeader) (*models.MediaFile, error) {
	// Öffne die Datei
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	// Erstelle das Verzeichnis, falls es nicht existiert
	dir := filepath.Join(s.baseDir, "uploads", "channels", strconv.FormatUint(uint64(channelID), 10))
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	// Erstelle die Zieldatei
	dstPath := filepath.Join(dir, file.Filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	// Kopiere die Datei
	if _, err := io.Copy(dst, src); err != nil {
		return nil, err
	}

	// Erstelle den Datenbankeintrag
	mediaFile := &models.MediaFile{
		ChannelID: channelID,
		UserID:    userID,
		Filename:  file.Filename,
		FileType:  file.Header.Get("Content-Type"),
		FileSize:  file.Size,
		URL:       "/uploads/channels/" + strconv.FormatUint(uint64(channelID), 10) + "/" + file.Filename,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(mediaFile).Error; err != nil {
		// Bei Fehler lösche die Datei
		os.Remove(dstPath)
		return nil, err
	}

	return mediaFile, nil
}

func (s *MediaService) DeleteFile(fileID uint) error {
	// Hole die Datei-Informationen
	var file models.MediaFile
	if err := s.db.First(&file, fileID).Error; err != nil {
		return err
	}

	// Lösche die Datei vom Dateisystem
	filePath := filepath.Join(s.baseDir, file.URL)
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		return err
	}

	// Lösche den Datenbankeintrag
	return s.db.Delete(&file).Error
}
