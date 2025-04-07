package services

import (
	"errors"
	"time"

	"github.com/auraspeak/backend/internal/models"
	"gorm.io/gorm"
)

type RoleService struct {
	db *gorm.DB
}

func NewRoleService(db *gorm.DB) *RoleService {
	return &RoleService{db: db}
}

func (s *RoleService) GetRoles(serverID uint) ([]models.Role, error) {
	var roles []models.Role
	err := s.db.Where("server_id = ?", serverID).Order("position asc").Find(&roles).Error
	return roles, err
}

func (s *RoleService) CreateRole(serverID uint, role *models.Role) (*models.Role, error) {
	// Setze ServerID und Timestamps
	role.ServerID = serverID
	role.CreatedAt = time.Now()
	role.UpdatedAt = time.Now()

	// Hole die höchste Position
	var maxPosition int
	s.db.Model(&models.Role{}).Where("server_id = ?", serverID).Select("COALESCE(MAX(position), -1)").Scan(&maxPosition)
	role.Position = maxPosition + 1

	if err := s.db.Create(role).Error; err != nil {
		return nil, err
	}

	return role, nil
}

func (s *RoleService) UpdateRole(serverID, roleID uint, updates *models.Role) error {
	updates.UpdatedAt = time.Now()
	return s.db.Model(&models.Role{}).Where("id = ? AND server_id = ?", roleID, serverID).Updates(updates).Error
}

func (s *RoleService) DeleteRole(serverID, roleID uint) error {
	// Überprüfe, ob es sich um die Standard-Rolle handelt
	var role models.Role
	if err := s.db.First(&role, roleID).Error; err != nil {
		return err
	}

	if role.ID == 1 { // Annahme: ID 1 ist die Standard-Rolle
		return errors.New("Die Standard-Rolle kann nicht gelöscht werden")
	}

	return s.db.Where("id = ? AND server_id = ?", roleID, serverID).Delete(&models.Role{}).Error
}

func (s *RoleService) UpdateRolePosition(serverID, roleID uint, position int) error {
	// Beginne Transaktion
	tx := s.db.Begin()

	// Hole die aktuelle Position der Rolle
	var currentRole models.Role
	if err := tx.First(&currentRole, roleID).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Aktualisiere die Positionen
	if position > currentRole.Position {
		// Rolle nach unten verschieben
		if err := tx.Model(&models.Role{}).
			Where("server_id = ? AND position > ? AND position <= ?", serverID, currentRole.Position, position).
			Update("position", gorm.Expr("position - 1")).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else if position < currentRole.Position {
		// Rolle nach oben verschieben
		if err := tx.Model(&models.Role{}).
			Where("server_id = ? AND position >= ? AND position < ?", serverID, position, currentRole.Position).
			Update("position", gorm.Expr("position + 1")).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	// Aktualisiere die Position der Rolle
	if err := tx.Model(&currentRole).Update("position", position).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
