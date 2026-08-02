package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/requestid"

	"yakinlulus.id/backend/internal/academic"
	"yakinlulus.id/backend/internal/admin"
	"yakinlulus.id/backend/internal/ai"
	"yakinlulus.id/backend/internal/analytics"
	"yakinlulus.id/backend/internal/audit"
	"yakinlulus.id/backend/internal/auth"
	"yakinlulus.id/backend/internal/cbt_engine"
	"yakinlulus.id/backend/internal/cbt_runtime"
	"yakinlulus.id/backend/internal/content"
	"yakinlulus.id/backend/internal/dashboard"
	"yakinlulus.id/backend/internal/gamification"
	"yakinlulus.id/backend/internal/material"
	"yakinlulus.id/backend/internal/media"
	"yakinlulus.id/backend/internal/middleware"
	"yakinlulus.id/backend/internal/notification"
	"yakinlulus.id/backend/internal/practice"
	"yakinlulus.id/backend/internal/profile"
	"yakinlulus.id/backend/internal/question_bank"
	"yakinlulus.id/backend/internal/school"
	"yakinlulus.id/backend/internal/scoring"
	"yakinlulus.id/backend/internal/shared"
	"yakinlulus.id/backend/internal/subscription"                   
	"yakinlulus.id/backend/internal/target_schools"                 
	"yakinlulus.id/backend/internal/ws"                             

	"yakinlulus.id/backend/pkg/cache"
	"yakinlulus.id/backend/pkg/config"
	"yakinlulus.id/backend/pkg/database"
	"yakinlulus.id/backend/pkg/storage"

	"github.com/redis/go-redis/v9"
)

func main() {
	cfg, err := config.Load("config.yaml")
	if err != nil {
		slog.Error("Failed to load config", "error", err)
		os.Exit(1)
	}

	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})))

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := database.NewPostgresPool(ctx, cfg.Database)
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("Connected to PostgreSQL")

	if err := database.AutoMigrate(ctx, pool, "migrations"); err != nil {
		slog.Error("Migration failed", "error", err)
		os.Exit(1)
	}
	slog.Info("Migrations applied")

	// Redis client — optional, skip if URL empty
	var rdb *redis.Client
	if cfg.Redis.URL != "" {
		rdb, err = cache.NewRedisClient(ctx, cfg.Redis.URL)
		if err != nil {
			slog.Warn("Redis connect failed, running without cache", "error", err)
		} else {
			slog.Info("Redis client connected")
			cache.PingBackground(ctx, rdb)
		}
	} else {
		slog.Warn("Redis unavailable, running without cache")
	}

	app := fiber.New(fiber.Config{
		AppName:      "YakinLulus.id API",
		ErrorHandler: shared.ErrorHandler,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.CORS.AllowedOrigins, ","),
		AllowCredentials: true,
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Request-ID",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}))
	app.Use(requestid.New())
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.Logger())
	rps := cfg.RateLimit.RequestsPerMinute / 60
	if rps < 1 {
		rps = 1
	}
	app.Use(middleware.NewRateLimiter(rps, cfg.RateLimit.Burst).Middleware())
	app.Use(middleware.SanitizeRequest())

	// Public health
	app.Get("/health", func(c *fiber.Ctx) error {
		var dbOk bool
		err := pool.QueryRow(ctx, "SELECT true").Scan(&dbOk)
		if err != nil {
			return c.JSON(fiber.Map{"status": "degraded", "database": "disconnected"})
		}
		return c.JSON(fiber.Map{
			"status":   "ok",
			"database": "connected",
		})
	})

	// OpenAPI spec + Swagger UI
	app.Get("/openapi.yaml", func(c *fiber.Ctx) error {
		return c.SendFile("openapi.yaml")
	})
	app.Get("/docs", func(c *fiber.Ctx) error {
		return c.Redirect("https://petstore.swagger.io/?url=" + fmt.Sprintf("%s/openapi.yaml", c.BaseURL()))
	})

	// Init modules
	authRepo := auth.NewRepository(pool)
	authSvc := auth.NewService(authRepo, cfg.JWT.Secret)
	authHandler := auth.NewHandler(authSvc, cfg.JWT.Secret)

	academicRepo := academic.NewRepository(pool)
	academicSvc := academic.NewService(academicRepo)
	academicHandler := academic.NewHandler(academicSvc, cfg.JWT.Secret)

	qbRepo := question_bank.NewRepository(pool)
	contentRepo := content.NewRepository(pool)
	contentHandler := content.NewHandler(contentRepo, cfg.JWT.Secret)
	qbSvc := question_bank.NewService(qbRepo, contentRepo)

	examSvc := cbt_engine.NewService(contentRepo)
	examHandler := cbt_engine.NewHandler(examSvc, cfg.JWT.Secret)

	cbtRepo := cbt_runtime.NewRepository(pool)
	cbtSvc := cbt_runtime.NewService(cbtRepo)
	cbtHandler := cbt_runtime.NewHandler(cbtSvc, cfg.JWT.Secret)

	scoreRepo := scoring.NewRepository(pool)
	scoreSvc := scoring.NewService(scoreRepo)
	scoreHandler := scoring.NewHandler(scoreSvc, cfg.JWT.Secret)

	mediaRepo := media.NewRepository(pool)
	mediaSvc := media.NewService(mediaRepo, nil)
	mediaHandler := media.NewHandler(mediaSvc, cfg.JWT.Secret)

	qbHandler := question_bank.NewHandler(qbSvc, cfg.JWT.Secret)

	analyticsRepo := analytics.NewRepository(pool)
	analyticsSvc := analytics.NewService(analyticsRepo)
	analyticsHandler := analytics.NewHandler(analyticsSvc, cfg.JWT.Secret)

	matSvc := material.NewService(contentRepo)
	matHandler := material.NewHandler(matSvc, cfg.JWT.Secret)

	// School module
	schoolRepo := school.NewRepository(pool)
	schoolSvc := school.NewService(schoolRepo)
	schoolHandler := school.NewHandler(schoolSvc, cfg.JWT.Secret)

	// Subscription module
	subRepo := subscription.NewRepository(pool)
	subSvc := subscription.NewService(subRepo)
	subHandler := subscription.NewHandler(subSvc, cfg.JWT.Secret)

	// Dashboard module
	dashRepo := dashboard.NewRepository(pool)
	dashSvc := dashboard.NewService(dashRepo)
	dashHandler := dashboard.NewHandler(dashSvc, cfg.JWT.Secret)

	// Notification module
	notifRepo := notification.NewRepository(pool)
	notifSvc := notification.NewService(notifRepo)
	notifHandler := notification.NewHandler(notifSvc, cfg.JWT.Secret)

	// Storage (MinIO) client — optional, skip if unconfigured
	var storageClient *storage.Client
	if cfg.Storage.Endpoint != "" {
		var stErr error
		storageClient, stErr = storage.NewClient(cfg.Storage.Endpoint, cfg.Storage.AccessKey, cfg.Storage.Bucket, cfg.Storage.PublicBaseURL)
		if stErr != nil {
			slog.Warn("MinIO client init failed, file upload will skip storage", "error", stErr)
		} else {
			slog.Info("MinIO client initialized", "bucket", cfg.Storage.Bucket, "endpoint", cfg.Storage.Endpoint)
		}
	}
	// Re-init media service with storage client
	mediaSvc = media.NewService(mediaRepo, storageClient)
	mediaHandler = media.NewHandler(mediaSvc, cfg.JWT.Secret)

	// AI Tutor module
	aiRepo := ai.NewRepository(pool)
	aiSvc := ai.NewService(aiRepo, cfg.AI.Endpoint, cfg.AI.APIKey, cfg.AI.Model)
	aiHandler := ai.NewHandler(aiSvc, cfg.JWT.Secret)

	// Audit Log module
	auditRepo := audit.NewRepository(pool)
	auditSvc := audit.NewService(auditRepo)
	auditHandler := audit.NewHandler(auditSvc, cfg.JWT.Secret)

	// Admin module
	adminRepo := admin.NewRepository(pool)
	adminSvc := admin.NewService(adminRepo)
	adminHandler := admin.NewHandler(adminSvc, cfg.JWT.Secret)

	// Practice module
	practiceRepo := practice.NewRepository(pool)
	practiceSvc := practice.NewService(practiceRepo, contentRepo)
	practiceHandler := practice.NewHandler(practiceSvc, cfg.JWT.Secret)

	// Gamification module
	gamiRepo := gamification.NewRepository(pool)
	gamiSvc := gamification.NewService(gamiRepo)
	gamiHandler := gamification.NewHandler(gamiSvc, cfg.JWT.Secret)

	// Student profile module
	profileRepo := profile.NewRepository(pool)
	profileSvc := profile.NewService(profileRepo)
	profileHandler := profile.NewHandler(profileSvc, cfg.JWT.Secret)

	// Target schools module
	targetSchoolRepo := target_schools.NewRepository(pool)
	targetSchoolSvc := target_schools.NewService(targetSchoolRepo)
	targetSchoolHandler := target_schools.NewHandler(targetSchoolSvc, cfg.JWT.Secret)

	// WebSocket hub for live CBT proctoring
	wsHub := ws.NewHub()
	go wsHub.Run()
	wsHandler := ws.NewHandler(wsHub, cfg.JWT.Secret)

	// Register routes
	api := app.Group("/api/v1")
	authHandler.RegisterRoutes(api)
	contentHandler.RegisterRoutes(api)
	academicHandler.RegisterRoutes(api)
	qbHandler.RegisterRoutes(api)
	practiceHandler.RegisterRoutes(api)
	examHandler.RegisterRoutes(api)
	cbtHandler.RegisterRoutes(api)
	// Admin-only CBT ops
	cbtAdmin := api.Group("/cbt/admin", middleware.RequireAuth(cfg.JWT.Secret), middleware.RequireRole("ADMIN"))
	cbtAdmin.Post("/auto-submit", cbtHandler.AutoSubmitExpired)
	scoreHandler.RegisterRoutes(api)
	analyticsHandler.RegisterRoutes(api)
	mediaHandler.RegisterRoutes(api)
	matHandler.RegisterRoutes(api)
	schoolHandler.RegisterRoutes(api)
	subHandler.RegisterRoutes(api)
	dashHandler.RegisterRoutes(api)
	notifHandler.RegisterRoutes(api)
	aiHandler.RegisterRoutes(api)
	auditHandler.RegisterRoutes(api)
	adminHandler.RegisterRoutes(api)
	wsHandler.RegisterRoutes(api)
	gamiHandler.RegisterRoutes(api)
	profileHandler.RegisterRoutes(api)                              
	targetSchoolHandler.RegisterRoutes(api)                         


	addr := cfg.App.Host + ":" + itoa(cfg.App.Port)
	slog.Info("Server starting", "addr", addr)

	go func() {
		if err := app.Listen(addr); err != nil {
			slog.Error("Server error", "error", err)
			cancel()
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down...")
	app.Shutdown()
	if rdb != nil {
		cache.Close(rdb)
	}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}
