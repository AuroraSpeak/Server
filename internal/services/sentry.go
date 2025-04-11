package services

import (
	"fmt"
	"time"

	"github.com/getsentry/sentry-go"
	sentryfiber "github.com/getsentry/sentry-go/fiber"
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
		// BeforeSend kann hier weiterhin verwendet werden, falls benötigt
	})

	if err != nil {
		return nil, fmt.Errorf("Sentry initialization failed: %v", err)
	}

	return &SentryService{
		logger: logger,
	}, nil
}

func (s *SentryService) CaptureError(err error, tags map[string]string, context map[string]interface{}) {
	sentry.WithScope(func(scope *sentry.Scope) {
		for k, v := range tags {
			scope.SetTag(k, v)
		}
		for k, v := range context {
			if contextMap, ok := v.(map[string]interface{}); ok {
				scope.SetContext(k, contextMap)
			}
		}
		eventID := sentry.CaptureException(err)
		if eventID != nil {
			s.logger.Error("Error captured by Sentry", zap.Error(err))
		}
	})
}

func (s *SentryService) CaptureMessage(message string, level sentry.Level, tags map[string]string) {
	sentry.WithScope(func(scope *sentry.Scope) {
		for k, v := range tags {
			scope.SetTag(k, v)
		}
		eventID := sentry.CaptureMessage(message)
		if eventID != nil {
			s.logger.Info("Message captured by Sentry",
				zap.String("message", message),
				zap.String("level", string(level)),
			)
		}
	})
}

func (s *SentryService) Flush() {
	sentry.Flush(2 * time.Second)
}

func getVersion() string {
	return "1.0.0"
}

// Middleware für Fiber
func (s *SentryService) Middleware() fiber.Handler {
	return sentryfiber.New(sentryfiber.Options{
		Repanic: true, // Panic nach dem Senden an Sentry erneut auslösen
	})
}
