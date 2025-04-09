package services

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"time"

	"github.com/auraspeak/backend/internal/monitoring"
	"github.com/auraspeak/backend/internal/types"
	"github.com/redis/go-redis/v9"
)

type CacheService struct {
	client *redis.Client
	ctx    context.Context
}

func NewCacheService(config *types.Config) (*CacheService, error) {
	options := &redis.Options{
		Addr:     config.Redis.Addr,
		Password: config.Redis.Password,
		DB:       config.Redis.DB,
	}

	// Erweiterte Konfiguration für die Produktion
	if config.Redis.ClusterMode {
		// Cluster-Modus Konfiguration
		options.MaxRetries = config.Redis.MaxRetries
		options.MinRetryBackoff = config.Redis.MinRetryBackoff
		options.MaxRetryBackoff = config.Redis.MaxRetryBackoff
	}

	// Timeout-Einstellungen
	options.DialTimeout = config.Redis.DialTimeout
	options.ReadTimeout = config.Redis.ReadTimeout
	options.WriteTimeout = config.Redis.WriteTimeout

	// Connection Pool Einstellungen
	options.PoolSize = config.Redis.PoolSize
	options.MinIdleConns = config.Redis.MinIdleConns
	options.PoolTimeout = config.Redis.PoolTimeout

	// TLS-Konfiguration
	if config.Redis.TLSEnabled {
		tlsConfig := &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
		if config.Redis.TLSCertFile != "" && config.Redis.TLSKeyFile != "" {
			cert, err := tls.LoadX509KeyPair(config.Redis.TLSCertFile, config.Redis.TLSKeyFile)
			if err != nil {
				return nil, err
			}
			tlsConfig.Certificates = []tls.Certificate{cert}
		}
		if config.Redis.TLSCACertFile != "" {
			// CA-Zertifikat laden und zur Konfiguration hinzufügen
			// Implementierung hier...
		}
		options.TLSConfig = tlsConfig
	}

	client := redis.NewClient(options)
	ctx := context.Background()

	// Teste die Verbindung
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &CacheService{
		client: client,
		ctx:    ctx,
	}, nil
}

// Get ruft einen Wert aus dem Cache ab
func (c *CacheService) Get(key string, result interface{}) error {
	start := time.Now()
	val, err := c.client.Get(c.ctx, key).Result()
	monitoring.DatabaseQueryDuration.WithLabelValues("cache_get").Observe(time.Since(start).Seconds())

	if err != nil {
		if err == redis.Nil {
			monitoring.CacheMisses.Inc()
		} else {
			monitoring.CacheErrors.Inc()
		}
		return err
	}

	monitoring.CacheHits.Inc()
	return json.Unmarshal([]byte(val), result)
}

// Set speichert einen Wert im Cache
func (c *CacheService) Set(key string, value interface{}, expiration time.Duration) error {
	start := time.Now()
	data, err := json.Marshal(value)
	if err != nil {
		monitoring.CacheErrors.Inc()
		return err
	}

	err = c.client.Set(c.ctx, key, data, expiration).Err()
	monitoring.DatabaseQueryDuration.WithLabelValues("cache_set").Observe(time.Since(start).Seconds())

	if err != nil {
		monitoring.CacheErrors.Inc()
	}
	return err
}

// Delete entfernt einen Wert aus dem Cache
func (c *CacheService) Delete(key string) error {
	start := time.Now()
	err := c.client.Del(c.ctx, key).Err()
	monitoring.DatabaseQueryDuration.WithLabelValues("cache_delete").Observe(time.Since(start).Seconds())

	if err != nil {
		monitoring.CacheErrors.Inc()
	}
	return err
}

// Clear löscht den gesamten Cache
func (c *CacheService) Clear() error {
	start := time.Now()
	err := c.client.FlushDB(c.ctx).Err()
	monitoring.DatabaseQueryDuration.WithLabelValues("cache_clear").Observe(time.Since(start).Seconds())

	if err != nil {
		monitoring.CacheErrors.Inc()
	}
	return err
}

// InvalidateByPattern löscht alle Cache-Einträge, die einem bestimmten Muster entsprechen
func (c *CacheService) InvalidateByPattern(pattern string) error {
	start := time.Now()
	keys, err := c.client.Keys(c.ctx, pattern).Result()
	if err != nil {
		monitoring.CacheErrors.Inc()
		return err
	}

	if len(keys) > 0 {
		err = c.client.Del(c.ctx, keys...).Err()
		monitoring.DatabaseQueryDuration.WithLabelValues("cache_invalidate_pattern").Observe(time.Since(start).Seconds())

		if err != nil {
			monitoring.CacheErrors.Inc()
		}
	}
	return err
}

// GetOrSet ruft einen Wert aus dem Cache ab oder setzt ihn, wenn er nicht existiert
func (c *CacheService) GetOrSet(key string, result interface{}, expiration time.Duration, setter func() (interface{}, error)) error {
	err := c.Get(key, result)
	if err == nil {
		return nil
	}

	if err != redis.Nil {
		return err
	}

	value, err := setter()
	if err != nil {
		return err
	}

	err = c.Set(key, value, expiration)
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(value.(string)), result)
}
