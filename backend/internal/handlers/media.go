package handlers

import (
	"strconv"

	"github.com/auraspeak/backend/internal/logging"
	"github.com/auraspeak/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type MediaHandler struct {
	mediaService *services.MediaService
	logger       *zap.Logger
}

func NewMediaHandler(mediaService *services.MediaService) *MediaHandler {
	return &MediaHandler{
		mediaService: mediaService,
		logger:       logging.NewLogger("media"),
	}
}

func (h *MediaHandler) GetFiles(c *fiber.Ctx) error {
	channelID, err := strconv.ParseUint(c.Params("channelId"), 10, 64)
	if err != nil {
		h.logger.Error("Ungültige Kanal-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Kanal-ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Debug("Medien-Dateien werden abgerufen",
		zap.Uint("userID", userID),
		zap.Uint64("channelID", channelID),
	)

	files, err := h.mediaService.GetFiles(uint(channelID))
	if err != nil {
		h.logger.Error("Fehler beim Abrufen der Medien-Dateien",
			zap.Error(err),
			zap.Uint64("channelID", channelID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	h.logger.Debug("Medien-Dateien erfolgreich abgerufen",
		zap.Uint64("channelID", channelID),
		zap.Int("fileCount", len(files)),
	)

	return c.JSON(files)
}

func (h *MediaHandler) UploadFile(c *fiber.Ctx) error {
	channelID, err := strconv.ParseUint(c.Params("channelId"), 10, 64)
	if err != nil {
		h.logger.Error("Ungültige Kanal-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Kanal-ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Neue Datei wird hochgeladen",
		zap.Uint("userID", userID),
		zap.Uint64("channelID", channelID),
	)

	file, err := c.FormFile("file")
	if err != nil {
		h.logger.Error("Keine Datei hochgeladen",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Uint64("channelID", channelID),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Keine Datei hochgeladen",
		})
	}

	mediaFile, err := h.mediaService.UploadFile(uint(channelID), userID, file)
	if err != nil {
		h.logger.Error("Fehler beim Hochladen der Datei",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Uint64("channelID", channelID),
			zap.String("fileName", file.Filename),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	h.logger.Info("Datei erfolgreich hochgeladen",
		zap.Uint("userID", userID),
		zap.Uint64("channelID", channelID),
		zap.String("fileName", file.Filename),
		zap.Uint("mediaFileID", mediaFile.ID),
	)

	return c.JSON(mediaFile)
}

func (h *MediaHandler) DeleteFile(c *fiber.Ctx) error {
	fileID, err := strconv.ParseUint(c.Params("fileId"), 10, 64)
	if err != nil {
		h.logger.Error("Ungültige Datei-ID",
			zap.Error(err),
		)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Ungültige Datei-ID",
		})
	}

	userID := c.Locals("userID").(uint)
	h.logger.Info("Datei wird gelöscht",
		zap.Uint("userID", userID),
		zap.Uint64("fileID", fileID),
	)

	if err := h.mediaService.DeleteFile(uint(fileID)); err != nil {
		h.logger.Error("Fehler beim Löschen der Datei",
			zap.Error(err),
			zap.Uint("userID", userID),
			zap.Uint64("fileID", fileID),
		)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	h.logger.Info("Datei erfolgreich gelöscht",
		zap.Uint("userID", userID),
		zap.Uint64("fileID", fileID),
	)

	return c.JSON(fiber.Map{
		"message": "Datei gelöscht",
	})
}
