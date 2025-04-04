package csrf

// Config enthält die Konfiguration für die CSRF-Middleware
type Config struct {
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

// DefaultConfig ist die Standardkonfiguration für die CSRF-Middleware
var DefaultConfig = Config{
	TokenLength:    32,
	CookieName:     "csrf_token",
	HeaderName:     "X-CSRF-Token",
	CookiePath:     "/",
	CookieDomain:   "",
	CookieSecure:   true,
	CookieHTTPOnly: true,
}
