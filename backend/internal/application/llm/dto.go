package llm

import "github.com/google/uuid"

type SubmitRequest struct {
	Prompt string `json:"prompt" validate:"required,max=5000"`
}

type SubmitResponse struct {
	IsBlocked      bool    `json:"is_blocked"`
	InjectionScore float64 `json:"injection_score"`
	PromptLogID    string  `json:"prompt_log_id"`
}

type ScoreLocalRequest struct {
	PromptLogID  uuid.UUID `json:"prompt_log_id" validate:"required"`
	Response     string    `json:"response" validate:"max=20000"`
	SpeedScore   float64   `json:"speed_score" validate:"min=0,max=1"`
	QualityScore float64   `json:"quality_score" validate:"min=0,max=1"`
	TotalScore   float64   `json:"total_score" validate:"min=0,max=1"`
}
