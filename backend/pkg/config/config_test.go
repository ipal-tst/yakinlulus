package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadConfig(t *testing.T) {
	yamlContent := `
app:
  env: production
  host: 0.0.0.0
  port: 8080
database:
  url: postgres://user:pass@localhost:5432/db
redis:
  url: redis://localhost:6379
jwt:
  secret: mysecret
  access_expiry: 15m
  refresh_expiry: 168h
storage:
  endpoint: s3.amazonaws.com
  access_key: AKID
  secret_key: secretkey
  bucket: mybucket
  use_ssl: true
cors:
  allowed_origins:
    - http://localhost:3000
rate_limit:
  requests_per_minute: 60
  burst: 20
log:
  level: info
  format: json
ai:
  endpoint: https://api.openai.com
  api_key: sk-xxx
  model: gpt-4
`

	for _, e := range []string{"DB_URL", "REDIS_URL", "JWT_SECRET", "AI_API_KEY", "AI_ENDPOINT", "AI_MODEL"} {
		t.Setenv(e, "")
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	require.NoError(t, os.WriteFile(path, []byte(yamlContent), 0644))

	cfg, err := Load(path)
	require.NoError(t, err)
	require.NotNil(t, cfg)

	assert.Equal(t, "production", cfg.App.Env)
	assert.Equal(t, "0.0.0.0", cfg.App.Host)
	assert.Equal(t, 8080, cfg.App.Port)

	assert.Equal(t, "postgres://user:pass@localhost:5432/db", cfg.Database.URL)
	assert.Equal(t, "redis://localhost:6379", cfg.Redis.URL)

	assert.Equal(t, "mysecret", cfg.JWT.Secret)
	assert.Equal(t, 15*time.Minute, cfg.JWT.AccessExpiry)
	assert.Equal(t, 168*time.Hour, cfg.JWT.RefreshExpiry)

	assert.Equal(t, "s3.amazonaws.com", cfg.Storage.Endpoint)
	assert.Equal(t, "AKID", cfg.Storage.AccessKey)
	assert.Equal(t, "secretkey", cfg.Storage.SecretKey)
	assert.Equal(t, "mybucket", cfg.Storage.Bucket)
	assert.True(t, cfg.Storage.UseSSL)

	assert.Equal(t, []string{"http://localhost:3000"}, cfg.CORS.AllowedOrigins)
	assert.Equal(t, 60, cfg.RateLimit.RequestsPerMinute)
	assert.Equal(t, 20, cfg.RateLimit.Burst)
	assert.Equal(t, "info", cfg.Log.Level)
	assert.Equal(t, "json", cfg.Log.Format)

	assert.Equal(t, "https://api.openai.com", cfg.AI.Endpoint)
	assert.Equal(t, "sk-xxx", cfg.AI.APIKey)
	assert.Equal(t, "gpt-4", cfg.AI.Model)
}

func TestLoadConfigDefaults(t *testing.T) {
	yamlContent := `
app:
  env: test
`

	for _, e := range []string{"DB_URL", "REDIS_URL", "JWT_SECRET", "AI_API_KEY", "AI_ENDPOINT", "AI_MODEL"} {
		t.Setenv(e, "")
	}

	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	require.NoError(t, os.WriteFile(path, []byte(yamlContent), 0644))

	cfg, err := Load(path)
	require.NoError(t, err)
	require.NotNil(t, cfg)

	assert.Equal(t, "test", cfg.App.Env)
	assert.Equal(t, "", cfg.App.Host)
	assert.Equal(t, 0, cfg.App.Port)
	assert.Equal(t, "", cfg.Database.URL)
	assert.Equal(t, "", cfg.Redis.URL)
	assert.Equal(t, "", cfg.JWT.Secret)
	assert.Equal(t, time.Duration(0), cfg.JWT.AccessExpiry)
	assert.Empty(t, cfg.CORS.AllowedOrigins)
	assert.Equal(t, 0, cfg.RateLimit.RequestsPerMinute)
	assert.Equal(t, "", cfg.AI.Endpoint)
	assert.Equal(t, "", cfg.Log.Level)
	assert.Equal(t, "", cfg.Log.Format)
}

func TestLoadConfigInvalidYAML(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	require.NoError(t, os.WriteFile(path, []byte("{{{broken yaml}}}"), 0644))

	cfg, err := Load(path)
	assert.Error(t, err)
	assert.Nil(t, cfg)
}
