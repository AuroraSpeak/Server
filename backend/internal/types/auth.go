package types

type AuthService interface {
	ValidateToken(token string) (map[string]interface{}, error)
}
