package model

import (
	"time"

	"github.com/google/uuid"
)

type PromptLog struct {
	ID             uuid.UUID      `json:"id"`
	UserID         uuid.UUID      `json:"user_id"`
	Prompt         string         `json:"prompt"`
	Response       string         `json:"response,omitempty"`
	InjectionScore float64        `json:"injection_score"`
	SpeedScore     float64        `json:"speed_score"`
	QualityScore   float64        `json:"quality_score"`
	TotalScore     float64        `json:"total_score"`
	IsBlocked      bool           `json:"is_blocked"`
	CreatedAt      time.Time      `json:"created_at"`
	InjectionLogs  []InjectionLog `json:"injection_logs,omitempty"`
}

type InjectionLog struct {
	ID           uuid.UUID `json:"id"`
	PromptLogID  uuid.UUID `json:"prompt_log_id"`
	Category     string    `json:"category"`
	PatternMatch string    `json:"pattern_match"`
	Confidence   float64   `json:"confidence"`
	CreatedAt    time.Time `json:"created_at"`
}
