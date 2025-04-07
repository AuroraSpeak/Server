package websocket

import (
	"fmt"
	"log"
)

// Debug-Flag
var DEBUG = true

// Logger für strukturiertes Logging
type Logger struct {
	prefix string
}

func NewLogger(prefix string) *Logger {
	return &Logger{
		prefix: prefix,
	}
}

func (l *Logger) Info(format string, v ...interface{}) {
	if DEBUG {
		log.Printf(fmt.Sprintf("[%s] %s", l.prefix, format), v...)
	}
}

func (l *Logger) Error(format string, v ...interface{}) {
	if DEBUG {
		log.Printf(fmt.Sprintf("[%s] ERROR: %s", l.prefix, format), v...)
	}
}

func (l *Logger) Debug(format string, v ...interface{}) {
	if DEBUG {
		log.Printf(fmt.Sprintf("[%s] DEBUG: %s", l.prefix, format), v...)
	}
}
