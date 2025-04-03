package services

import (
	"context"
	"encoding/json"
	"time"

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
	val, err := c.client.Get(c.ctx, key).Result()
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(val), result)
}

// Set speichert einen Wert im Cache
func (c *CacheService) Set(key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return c.client.Set(c.ctx, key, data, expiration).Err()
}

// Delete entfernt einen Wert aus dem Cache
func (c *CacheService) Delete(key string) error {
	return c.client.Del(c.ctx, key).Err()
}

// Clear löscht den gesamten Cache
func (c *CacheService) Clear() error {
	return c.client.FlushDB(c.ctx).Err()
}
