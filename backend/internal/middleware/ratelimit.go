package middleware

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/time/rate"

	"yakinlulus.id/backend/internal/shared"
)

type RateLimiter struct {
	mu       sync.RWMutex
	visitors map[string]*rate.Limiter
	rate     rate.Limit
	burst    int
	ttl      time.Duration
	lastSeen map[string]time.Time
}

func NewRateLimiter(rps int, burst int) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*rate.Limiter),
		rate:     rate.Limit(rps),
		burst:    burst,
		ttl:      5 * time.Minute,
		lastSeen: make(map[string]time.Time),
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.visitors[key]
	if !exists {
		limiter = rate.NewLimiter(rl.rate, rl.burst)
		rl.visitors[key] = limiter
	}
	rl.lastSeen[key] = time.Now()
	return limiter
}

func (rl *RateLimiter) cleanup() {
	for {
		time.Sleep(10 * time.Minute)
		rl.mu.Lock()
		for key, seen := range rl.lastSeen {
			if time.Since(seen) > rl.ttl {
				delete(rl.visitors, key)
				delete(rl.lastSeen, key)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		key := c.IP()
		if uid := c.Locals("user_id"); uid != nil {
			key = uid.(string)
		}

		limiter := rl.getLimiter(key)
		if !limiter.Allow() {
			return c.Status(429).JSON(shared.Error(shared.ErrorCode("RATE_LIMITED"), "Too many requests"))
		}
		return c.Next()
	}
}
