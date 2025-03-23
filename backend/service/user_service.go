package service

import (
	"github.com/AuroraSpeak/Server/models"
	"github.com/AuroraSpeak/Server/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"os"
	"time"
)

type AuthService interface {
	Register(username, password string) error
	Login(username, password string) (string, error)
}

type authService struct {
	userRepo repository.UserRepo
}

func NewAuthService(r repository.UserRepo) AuthService {
	return &authService{userRepo: r}
}

func (s *authService) Register(username, password string) error {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
	user := &models.User{Username: username, Password: string(hash)}
	return s.userRepo.CreateUser(user)
}

func (s *authService) Login(username, password string) (string, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)) != nil {
		return "", err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
