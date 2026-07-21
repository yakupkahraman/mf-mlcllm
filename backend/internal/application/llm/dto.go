package llm

import "github.com/google/uuid"

type SubmitRequest struct {
	Prompt string `json:"prompt"`
}

type SubmitResponse struct {
	IsBlocked      bool    `json:"is_blocked"`
	InjectionScore float64 `json:"injection_score"`
	PromptLogID    string  `json:"prompt_log_id"`
}

type ScoreLocalRequest struct {
	PromptLogID  uuid.UUID `json:"prompt_log_id"`
	Response     string    `json:"response"`
	SpeedScore   float64   `json:"speed_score"`
	QualityScore float64   `json:"quality_score"`
	TotalScore   float64   `json:"total_score"`
}
