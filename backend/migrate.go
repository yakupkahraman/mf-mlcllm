package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

func main() {
	dsn := "postgresql://mf_mlcllm_db_user:nEovrWQsC40lTWzYGkSmcKWcj9SZbWRy@dpg-d9fp0grrjlhs73apmpr0-a.oregon-postgres.render.com/mf_mlcllm_db?sslmode=require"
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer conn.Close(context.Background())

	sql := `
	CREATE TABLE IF NOT EXISTS users (
		id UUID PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL,
		updated_at TIMESTAMP WITH TIME ZONE NOT NULL
	);

	CREATE TABLE IF NOT EXISTS prompt_logs (
		id UUID PRIMARY KEY,
		user_id UUID,
		prompt TEXT NOT NULL,
		response TEXT,
		injection_score DOUBLE PRECISION,
		speed_score DOUBLE PRECISION,
		quality_score DOUBLE PRECISION,
		total_score DOUBLE PRECISION,
		is_blocked BOOLEAN NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL
	);

	CREATE TABLE IF NOT EXISTS injection_logs (
		id UUID PRIMARY KEY,
		prompt_log_id UUID NOT NULL,
		category VARCHAR(255) NOT NULL,
		pattern_match TEXT NOT NULL,
		confidence DOUBLE PRECISION NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE NOT NULL
	);`

	_, err = conn.Exec(ctx, sql)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Exec failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Tables created successfully")
}
