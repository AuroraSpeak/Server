package services

import (
	"context"
	"fmt"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type SentryService struct {
	logger *zap.Logger
}

func NewSentryService(dsn string, environment string, logger *zap.Logger) (*SentryService, error) {
	err := sentry.Init(sentry.ClientOptions{
		Dsn:              dsn,
		Environment:      environment,
		Release:          "auraspeak@" + getVersion(),
		AttachStacktrace: true,
		BeforeSend: func(event *sentry.Event, hint *sentry.EventHint) *sentry.Event {
			// Füge zusätzliche Kontextinformationen hinzu
			if hint.Context != nil {
				if ctx, ok := hint.Context.Value("request").(context.Context); ok {
					// Füge Request-Informationen hinzu
					if req, ok := ctx.Value("request").(interface{}); ok {
						event.Request = sentry.NewRequest(req)
					}
				}
			}
			return event
		},
	})

	if err != nil {
		return nil, fmt.Errorf("Sentry initialization failed: %v", err)
	}

	return &SentryService{
		logger: logger,
	}, nil
}

func (s *SentryService) CaptureError(err error, tags map[string]string, context map[string]interface{}) {
	eventID := sentry.CaptureException(err)
	if eventID != nil {
		s.logger.Error("Error captured by Sentry",
			zap.Error(err),
			zap.String("event_id", eventID.String()),
		)
	}

	// Füge Tags und Kontext hinzu
	if len(tags) > 0 {
		sentry.ConfigureScope(func(scope *sentry.Scope) {
			for k, v := range tags {
				scope.SetTag(k, v)
			}
		})
	}

	if len(context) > 0 {
		sentry.ConfigureScope(func(scope *sentry.Scope) {
			for k, v := range context {
				scope.SetContext(k, v)
			}
		})
	}
}

func (s *SentryService) CaptureMessage(message string, level sentry.Level, tags map[string]string) {
	eventID := sentry.CaptureMessage(message)
	if eventID != nil {
		s.logger.Info("Message captured by Sentry",
			zap.String("message", message),
			zap.String("level", level.String()),
			zap.String("event_id", eventID.String()),
		)
	}

	if len(tags) > 0 {
		sentry.ConfigureScope(func(scope *sentry.Scope) {
			for k, v := range tags {
				scope.SetTag(k, v)
			}
		})
	}
}

func (s *SentryService) Flush() {
	sentry.Flush(2 * time.Second)
}

func getVersion() string {
	// Hier können Sie die Version Ihrer Anwendung zurückgeben
	// Zum Beispiel aus einer Build-Variable oder Git-Tag
	return "1.0.0"
}

// Middleware für Fiber
func (s *SentryService) Middleware() func(c *fiber.Ctx) error {
	return func(c *fiber.Ctx) error {
		hub := sentry.CurrentHub().Clone()
		ctx := c.Context()

		// Füge Request-Informationen zum Scope hinzu
		hub.Scope().SetRequest(sentry.NewRequest(c.Request()))

		// Füge User-Informationen hinzu, falls verfügbar
		if userID := c.Locals("userID"); userID != nil {
			hub.Scope().SetUser(sentry.User{
				ID: fmt.Sprintf("%v", userID),
			})
		}

		// Setze den Hub im Context
		ctx.SetUserValue("sentry", hub)

		// Führe den nächsten Handler aus
		err := c.Next()

		// Wenn ein Fehler aufgetreten ist, sende ihn an Sentry
		if err != nil {
			hub.CaptureException(err)
		}

		return err
	}
}
