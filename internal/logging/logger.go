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

// LogLevel definiert die verfügbaren Log-Levels
type LogLevel string

const (
	DebugLevel LogLevel = "debug"
	InfoLevel  LogLevel = "info"
	WarnLevel  LogLevel = "warn"
	ErrorLevel LogLevel = "error"
	FatalLevel LogLevel = "fatal"
)

// Init initialisiert den Logger
func Init(environment string, level LogLevel) error {
	var config zap.Config

	if environment == "production" {
		config = zap.NewProductionConfig()
	} else {
		config = zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// Setze das Log-Level
	config.Level = zap.NewAtomicLevelAt(getZapLevel(level))

	// Konfiguriere die Zeitstempel
	config.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout(time.RFC3339)
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.LevelKey = "level"
	config.EncoderConfig.MessageKey = "message"

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
		zap.String("environment", os.Getenv("ENVIRONMENT")),
	)
}

// Debug loggt eine Debug-Nachricht
func Debug(msg string, fields ...zapcore.Field) {
	Logger.Debug(msg, fields...)
}

// Info loggt eine Info-Nachricht
func Info(msg string, fields ...zapcore.Field) {
	Logger.Info(msg, fields...)
}

// Warn loggt eine Warn-Nachricht
func Warn(msg string, fields ...zapcore.Field) {
	Logger.Warn(msg, fields...)
}

// Error loggt eine Error-Nachricht
func Error(msg string, fields ...zapcore.Field) {
	Logger.Error(msg, fields...)
}

// Fatal loggt eine Fatal-Nachricht und beendet das Programm
func Fatal(msg string, fields ...zapcore.Field) {
	Logger.Fatal(msg, fields...)
}

// WithFields erstellt einen neuen Logger mit zusätzlichen Feldern
func WithFields(fields ...zapcore.Field) *zap.Logger {
	return Logger.With(fields...)
}

// Sync synchronisiert den Logger
func Sync() error {
	return Logger.Sync()
}

// getZapLevel konvertiert ein LogLevel in ein zapcore.Level
func getZapLevel(level LogLevel) zapcore.Level {
	switch level {
	case DebugLevel:
		return zapcore.DebugLevel
	case InfoLevel:
		return zapcore.InfoLevel
	case WarnLevel:
		return zapcore.WarnLevel
	case ErrorLevel:
		return zapcore.ErrorLevel
	case FatalLevel:
		return zapcore.FatalLevel
	default:
		return zapcore.InfoLevel
	}
}
