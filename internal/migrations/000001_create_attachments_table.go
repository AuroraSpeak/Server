package migrations

import (
	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

func CreateAttachmentsTable(db *gorm.DB) error {
	return db.AutoMigrate(&models.Attachment{})
}

func DropAttachmentsTable(db *gorm.DB) error {
	return db.Migrator().DropTable(&models.Attachment{})
}
