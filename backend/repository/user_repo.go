package repository

import (
	"github.com/AuroraSpeak/Server/config"
	"github.com/AuroraSpeak/Server/models"
)

type UserRepo interface {
	CreateUser(user *models.User) error
	FindByUsername(username string) (*models.User, error)
}

type userRepo struct{}

func NewUserRepo() UserRepo {
	return &userRepo{}
}

func (r *userRepo) CreateUser(user *models.User) error {
	query := `INSERT INTO users (username, password) VALUES ($1, $2)`
	_, err := config.DB.Exec(query, user.Username, user.Password)
	return err
}

func (r *userRepo) FindByUsername(username string) (*models.User, error) {
	var user models.User
	query := `SELECT * FROM users WHERE username=$1`
	err := config.DB.Get(&user, query, username)
	return &user, err
}
