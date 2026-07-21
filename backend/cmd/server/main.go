package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	// Infrastructure
	infraAuth "mf-mlcllm/internal/infrastructure/auth"
	authHandler "mf-mlcllm/internal/infrastructure/http/handler/auth"
	commonHandler "mf-mlcllm/internal/infrastructure/http/handler/common"
	llmHandler "mf-mlcllm/internal/infrastructure/http/handler/llm"
	"mf-mlcllm/internal/infrastructure/http/router"
	pgAuth "mf-mlcllm/internal/infrastructure/postgres/auth"
	pgLLM "mf-mlcllm/internal/infrastructure/postgres/llm"

	// Application use cases
	authUC "mf-mlcllm/internal/application/auth"
	llmUC "mf-mlcllm/internal/application/llm"

	// Shared
	"mf-mlcllm/internal/shared/cache"
	"mf-mlcllm/internal/shared/config"
	"mf-mlcllm/internal/shared/database"
	"mf-mlcllm/internal/shared/logger"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	cfg := config.Load()

	log := logger.New(cfg.Log.Level, cfg.Log.Format)
	slog.SetDefault(log)

	log.Info("starting mf-mlcllm backend",
		"host", cfg.Server.Host,
		"port", cfg.Server.Port,
	)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := database.NewPostgresPool(ctx, cfg.Database)
	if err != nil {
		log.Warn("postgres unavailable", "error", err)
		db = nil
	} else {
		defer db.Close()
		log.Info("connected to postgres")
	}

	redisClient, err := cache.NewRedisClient(ctx, cfg.Redis)
	if err != nil {
		log.Warn("redis unavailable", "error", err)
		redisClient = nil
	} else {
		defer redisClient.Close()
		log.Info("connected to redis")
	}

	deps := buildDependencies(log, cfg, db, redisClient)
	r := router.New(deps)

	addr := fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	serverErr := make(chan error, 1)
	go func() {
		log.Info("listening", "addr", addr)
		serverErr <- srv.ListenAndServe()
	}()

	select {
	case err := <-serverErr:
		if err != nil && err != http.ErrServerClosed {
			return fmt.Errorf("server error: %w", err)
		}
	case sig := <-shutdown:
		log.Info("shutdown signal received", "signal", sig)
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer shutdownCancel()

		if err := srv.Shutdown(shutdownCtx); err != nil {
			_ = srv.Close()
			return fmt.Errorf("graceful shutdown failed: %w", err)
		}
		log.Info("server stopped gracefully")
	}

	return nil
}

func buildDependencies(
	log *slog.Logger,
	cfg *config.Config,
	db *pgxpool.Pool,
	redisClient *redis.Client,
) router.Dependencies {
	deps := router.Dependencies{
		Logger:             log,
		DB:                 db,
		Redis:              redisClient,
		CORSAllowedOrigins: cfg.Server.CORSAllowedOrigins,
		MaxBodyBytes:       cfg.Server.MaxBodyBytes,
	}

	// Repositories
	userRepo := pgAuth.NewRepository(db)
	promptRepo := pgLLM.NewRepository(db)

	// Services
	jwtService := infraAuth.NewJWTService(cfg.JWT)

	// Use cases
	authUseCase := authUC.NewUseCase(userRepo, jwtService)
	llmUseCase := llmUC.NewUseCase(promptRepo)

	// Handlers
	deps.AuthHandler = authHandler.NewHandler(authUseCase)
	deps.LLMHandler = llmHandler.NewHandler(llmUseCase)
	deps.CommonHandler = commonHandler.NewHandler()

	return deps
}
