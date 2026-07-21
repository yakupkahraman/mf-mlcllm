package llm

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"mf-mlcllm/internal/domain/model"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) SaveLog(ctx context.Context, log *model.PromptLog) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `INSERT INTO prompt_logs (id, user_id, prompt, injection_score, is_blocked, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err = tx.Exec(ctx, query, log.ID, log.UserID, log.Prompt, log.InjectionScore, log.IsBlocked, log.CreatedAt)
	if err != nil {
		return err
	}

	for _, inj := range log.InjectionLogs {
		iq := `INSERT INTO injection_logs (id, prompt_log_id, category, pattern_match, confidence, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
		_, err = tx.Exec(ctx, iq, inj.ID, inj.PromptLogID, inj.Category, inj.PatternMatch, inj.Confidence, inj.CreatedAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *Repository) UpdateScores(ctx context.Context, logID uuid.UUID, resp string, speed float64, quality float64, total float64) error {
	query := `UPDATE prompt_logs SET response = $1, speed_score = $2, quality_score = $3, total_score = $4 WHERE id = $5`
	_, err := r.db.Exec(ctx, query, resp, speed, quality, total, logID)
	return err
}

func (r *Repository) GetHistory(ctx context.Context, userID uuid.UUID) ([]model.PromptLog, error) {
	query := `SELECT id, user_id, prompt, response, injection_score, speed_score, quality_score, total_score, is_blocked, created_at FROM prompt_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := make([]model.PromptLog, 0, 50)
	for rows.Next() {
		var l model.PromptLog
		var resp *string
		err := rows.Scan(&l.ID, &l.UserID, &l.Prompt, &resp, &l.InjectionScore, &l.SpeedScore, &l.QualityScore, &l.TotalScore, &l.IsBlocked, &l.CreatedAt)
		if err != nil {
			return nil, err
		}
		if resp != nil {
			l.Response = *resp
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func (r *Repository) GetMetrics(ctx context.Context) (map[string]interface{}, error) {
	var total, blocked int
	var avgQuality, avgSpeed float64
	
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM prompt_logs").Scan(&total)
	if err != nil { return nil, err }
	
	err = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM prompt_logs WHERE is_blocked = true").Scan(&blocked)
	if err != nil { return nil, err }
	
	err = r.db.QueryRow(ctx, "SELECT COALESCE(AVG(quality_score), 0) FROM prompt_logs WHERE is_blocked = false").Scan(&avgQuality)
	if err != nil { return nil, err }
	
	err = r.db.QueryRow(ctx, "SELECT COALESCE(AVG(speed_score), 0) FROM prompt_logs WHERE is_blocked = false").Scan(&avgSpeed)
	if err != nil { return nil, err }

	return map[string]interface{}{
		"total_prompts": total,
		"blocked_prompts": blocked,
		"average_quality": avgQuality,
		"average_speed": avgSpeed,
	}, nil
}

func (r *Repository) GetDetailedMetrics(ctx context.Context) (map[string]interface{}, error) {
	// 1. Single Aggregation Query for Total, Blocked, and Quality Distribution
	queryMetrics := `
		SELECT 
			COUNT(*) as total, 
			COALESCE(SUM(CASE WHEN is_blocked = true THEN 1 ELSE 0 END), 0) as blocked,
			COALESCE(SUM(CASE WHEN is_blocked = false AND quality_score < 0.8 THEN 1 ELSE 0 END), 0) as low_quality,
			COALESCE(SUM(CASE WHEN is_blocked = false AND quality_score >= 0.8 AND quality_score <= 0.9 THEN 1 ELSE 0 END), 0) as medium_quality,
			COALESCE(SUM(CASE WHEN is_blocked = false AND quality_score > 0.9 THEN 1 ELSE 0 END), 0) as high_quality
		FROM prompt_logs
	`
	var total, blocked, low, medium, high int
	err := r.db.QueryRow(ctx, queryMetrics).Scan(&total, &blocked, &low, &medium, &high)
	if err != nil {
		return nil, err
	}

	// 3. Security Threats (Categories from injection logs)
	var threatCategories = make(map[string]int)
	query := `SELECT category, COUNT(*) FROM injection_logs GROUP BY category`
	rows, err := r.db.Query(ctx, query)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var cat string
			var count int
			if err := rows.Scan(&cat, &count); err == nil {
				threatCategories[cat] = count
			}
		}
	}

	return map[string]interface{}{
		"security_ratio": map[string]int{
			"clean":   total - blocked,
			"blocked": blocked,
		},
		"quality_distribution": map[string]int{
			"low":    low,
			"medium": medium,
			"high":   high,
		},
		"threat_categories": threatCategories,
	}, nil
}
