package logging

import (
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	// Logger ist die globale Logger-Instanz
	Logger *zap.Logger
)

// Init initialisiert den Logger
func Init(environment string) error {
	var config zap.Config

	if environment == "production" {
		config = zap.NewProductionConfig()
	} else {
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// Konfiguriere die Zeitstempel
	config.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout(time.RFC3339)

	// Konfiguriere die Ausgabe
	config.OutputPaths = []string{"stdout"}
	config.ErrorOutputPaths = []string{"stderr"}

	// Erstelle den Logger
	var err error
	Logger, err = config.Build()
	if err != nil {
		return err
	}

	// Ersetze den globalen Logger
	zap.ReplaceGlobals(Logger)

	return nil
}

// NewLogger erstellt einen neuen Logger mit zusätzlichen Feldern
func NewLogger(module string) *zap.Logger {
	return Logger.With(
		zap.String("module", module),
		zap.String("pid", os.Getenv("PID")),
		zap.String("hostname", os.Getenv("HOSTNAME")),
	)
}

// Sync synchronisiert den Logger
func Sync() error {
	return Logger.Sync()
}
