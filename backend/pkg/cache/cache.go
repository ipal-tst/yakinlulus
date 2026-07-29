package cache

import (
	"context"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// NewRedisClient returns a redis.Client if url is non-empty, nil otherwise.
func NewRedisClient(ctx context.Context, url string) (*redis.Client, error) {
	if url == "" {
		return nil, nil
	}
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	rdb := redis.NewClient(opts)
	if err := rdb.Ping(ctx).Err(); err != nil {
		rdb.Close()
		return nil, err
	}
	return rdb, nil
}

// Ping checks connectivity.
func Ping(ctx context.Context, rdb *redis.Client) error {
	return rdb.Ping(ctx).Err()
}

// Close wraps redis.Client.Close.
func Close(rdb *redis.Client) error {
	return rdb.Close()
}

// PingBackground starts a goroutine that pings Redis every 30s.
// Caller should cancel ctx to stop.
func PingBackground(ctx context.Context, rdb *redis.Client) {
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				if err := rdb.Ping(ctx).Err(); err != nil {
					slog.Warn("Redis ping failed", "error", err)
				}
			case <-ctx.Done():
				return
			}
		}
	}()
}
