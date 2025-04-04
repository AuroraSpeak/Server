package main

import (
	"log"
	"os"

	"github.com/auraspeak/backend/internal/setup"
)

func main() {
	if err := setup.RunSetup(); err != nil {
		log.Printf("Fehler beim Setup: %v\n", err)
		os.Exit(1)
	}
}
