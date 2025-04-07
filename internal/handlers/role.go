package handlers

import (
	"strconv"

	"github.com/auraspeak/backend/internal/models"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
)

type RoleHandler struct {
	roleService *services.RoleService
}

func NewRoleHandler(roleService *services.RoleService) *RoleHandler {
	return &RoleHandler{
		roleService: roleService,
	}
}

func (h *RoleHandler) GetRoles(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	roles, err := h.roleService.GetRoles(uint(serverID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(roles)
}

func (h *RoleHandler) CreateRole(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	var role models.Role
	if err := c.BodyParser(&role); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	newRole, err := h.roleService.CreateRole(uint(serverID), &role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(newRole)
}

func (h *RoleHandler) UpdateRole(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	roleID, err := strconv.ParseUint(c.Params("roleId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Rollen-ID",
		})
	}

	var updates models.Role
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	if err := h.roleService.UpdateRole(uint(serverID), uint(roleID), &updates); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Rolle aktualisiert",
	})
}

func (h *RoleHandler) DeleteRole(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	roleID, err := strconv.ParseUint(c.Params("roleId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Rollen-ID",
		})
	}

	if err := h.roleService.DeleteRole(uint(serverID), uint(roleID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Rolle gelöscht",
	})
}

func (h *RoleHandler) UpdateRolePosition(c *fiber.Ctx) error {
	serverID, err := strconv.ParseUint(c.Params("serverId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Server-ID",
		})
	}

	roleID, err := strconv.ParseUint(c.Params("roleId"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Rollen-ID",
		})
	}

	var req struct {
		Position int `json:"position"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Anfrage",
		})
	}

	if err := h.roleService.UpdateRolePosition(uint(serverID), uint(roleID), req.Position); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message": "Rollenposition aktualisiert",
	})
}
