package config

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq" // oder _ "modernc.org/sqlite"
	"log"
	"os"
)

var DB *sqlx.DB

func ConnectDB() {
	dsn := os.Getenv("DATABASE_URL")
	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalln("DB connection failed:", err)
	}
	DB = db
	fmt.Println("Connected to Database")
}
