package types

// Config repräsentiert die Anwendungskonfiguration
type Config struct {
	Environment    string
	Port           string
	JWTSecret      string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	AllowedOrigins string
	STUNServers    []string
	TURNServers    []struct {
		URL      string
		Username string
		Password string
	}
	LocalTURN struct {
		Enabled           bool
		PublicIP          string
		Port              int
		Realm             string
		Username          string
		Password          string
		MaxConnections    int
		ConnectionTimeout int
		RateLimit         struct {
			RequestsPerSecond int
			BurstSize         int
		}
		AllowedIPs []string
		DeniedIPs  []string
	}
	Redis struct {
		Addr     string
		Password string
		DB       int
	}
}
