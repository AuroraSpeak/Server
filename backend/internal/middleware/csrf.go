package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"strings"

	"github.com/auraspeak/backend/internal/csrf"
	"github.com/auraspeak/backend/internal/logging"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// CSRFConfig enthält die Konfiguration für die CSRF-Middleware
type CSRFConfig struct {
	// TokenLength ist die Länge des CSRF-Tokens in Bytes
	TokenLength int
	// CookieName ist der Name des Cookies, der das CSRF-Token enthält
	CookieName string
	// HeaderName ist der Name des Headers, der das CSRF-Token enthält
	HeaderName string
	// CookiePath ist der Pfad für den CSRF-Cookie
	CookiePath string
	// CookieDomain ist die Domain für den CSRF-Cookie
	CookieDomain string
	// CookieSecure bestimmt, ob der Cookie nur über HTTPS gesendet werden soll
	CookieSecure bool
	// CookieHTTPOnly bestimmt, ob der Cookie nur über HTTP(S) und nicht über JavaScript zugänglich ist
	CookieHTTPOnly bool
}

// DefaultCSRFConfig ist die Standardkonfiguration für die CSRF-Middleware
var DefaultCSRFConfig = CSRFConfig{
	TokenLength:    32,
	CookieName:     "csrf_token",
	HeaderName:     "X-CSRF-Token",
	CookiePath:     "/",
	CookieDomain:   "",
	CookieSecure:   true,
	CookieHTTPOnly: true,
}

// CSRFMiddleware ist die Middleware für CSRF-Schutz
func CSRFMiddleware(cfg ...csrf.Config) fiber.Handler {
	config := csrf.DefaultConfig
	if len(cfg) > 0 {
		config = cfg[0]
	}

	logger := logging.NewLogger("csrf")

	return func(c *fiber.Ctx) error {
		// Generiere ein neues CSRF-Token
		token := make([]byte, config.TokenLength)
		if _, err := rand.Read(token); err != nil {
			logger.Error("Fehler beim Generieren des CSRF-Tokens",
				zap.Error(err),
			)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to generate CSRF token",
			})
		}
		tokenString := base64.StdEncoding.EncodeToString(token)

		// Setze das CSRF-Token als Cookie
		c.Cookie(&fiber.Cookie{
			Name:     config.CookieName,
			Value:    tokenString,
			Path:     config.CookiePath,
			Domain:   config.CookieDomain,
			Secure:   config.CookieSecure,
			HTTPOnly: config.CookieHTTPOnly,
			SameSite: "Strict",
		})

		// Bei GET-Anfragen nur das Token setzen
		if c.Method() == "GET" {
			return c.Next()
		}

		// Bei anderen Methoden das Token validieren
		headerToken := c.Get(config.HeaderName)
		cookieToken := c.Cookies(config.CookieName)

		if headerToken == "" || cookieToken == "" || !strings.EqualFold(headerToken, cookieToken) {
			logger.Warn("Ungültiges CSRF-Token",
				zap.String("method", c.Method()),
				zap.String("path", c.Path()),
				zap.String("ip", c.IP()),
			)
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Invalid CSRF token",
			})
		}

		return c.Next()
	}
}
