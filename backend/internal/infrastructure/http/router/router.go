package router

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"

	infraAuth "mf-mlcllm/internal/infrastructure/auth"
	"mf-mlcllm/internal/infrastructure/http/handler/auth"
	"mf-mlcllm/internal/infrastructure/http/handler/common"
	"mf-mlcllm/internal/infrastructure/http/handler/llm"
	appMiddleware "mf-mlcllm/internal/infrastructure/http/middleware"
)

type Dependencies struct {
	Logger             *slog.Logger
	DB                 *pgxpool.Pool
	Redis              *redis.Client
	CORSAllowedOrigins []string
	MaxBodyBytes       int64

	AuthHandler   *auth.Handler
	LLMHandler    *llm.Handler
	CommonHandler *common.Handler
	JWTService    *infraAuth.JWTService
}

func New(deps Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(appMiddleware.MaxBytes(deps.MaxBodyBytes))
	
	// AppSec: Basic Rate Limiting to prevent DoS attacks (100 reqs/min per IP)
	r.Use(httprate.LimitByIP(100, 1*time.Minute))

	corsOpts := cors.Options{
		AllowedOrigins:   deps.CORSAllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-User-ID"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}
	r.Use(cors.Handler(corsOpts))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", deps.CommonHandler.Health)
		r.Get("/version", deps.CommonHandler.Version)

		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", deps.AuthHandler.Register)
			r.Post("/login", deps.AuthHandler.Login)
			
			r.Group(func(r chi.Router) {
				r.Use(appMiddleware.Auth(deps.JWTService))
				r.Get("/me", deps.AuthHandler.Me)
			})
		})

		r.Route("/llm", func(r chi.Router) {
			r.Group(func(r chi.Router) {
				r.Use(appMiddleware.Auth(deps.JWTService))
				r.Post("/submit", deps.LLMHandler.Submit)
				r.Post("/score-local", deps.LLMHandler.ScoreLocal)
				r.Get("/history", deps.LLMHandler.History)
				r.Get("/metrics", deps.LLMHandler.Metrics)
				r.Get("/metrics/detailed", deps.LLMHandler.DetailedMetrics)
			})
		})
	})

	return r
}
