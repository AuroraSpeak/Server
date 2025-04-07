package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/auraspeak/backend/internal/monitoring"
	"github.com/redis/go-redis/v9"
)

type CacheService struct {
	client *redis.Client
	ctx    context.Context
}

func NewCacheService(addr string, password string, db int) (*CacheService, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

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
