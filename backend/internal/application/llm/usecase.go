package llm

import (
	"context"
	"regexp"
	"time"

	"github.com/google/uuid"
	"mf-mlcllm/internal/domain/model"
)

type PromptRepository interface {
	SaveLog(ctx context.Context, log *model.PromptLog) error
	UpdateScores(ctx context.Context, logID uuid.UUID, resp string, speed float64, quality float64, total float64) error
	GetHistory(ctx context.Context, userID uuid.UUID) ([]model.PromptLog, error)
	GetMetrics(ctx context.Context) (map[string]interface{}, error)
}

type UseCase struct {
	repo PromptRepository
}

func NewUseCase(repo PromptRepository) *UseCase {
	return &UseCase{repo: repo}
}

// 7 Categories of Injection Detection
var injectionPatterns = map[string]*regexp.Regexp{
	"Direct Override":       regexp.MustCompile(`(?i)(ignore (all )?previous instructions|disregard|forget what i told you)`),
	"Role-Play/Jailbreak":   regexp.MustCompile(`(?i)(you are now|act as|pretend to be|dan|do anything now)`),
	"Extraction":            regexp.MustCompile(`(?i)(output your instructions|reveal your prompt|what is your system prompt)`),
	"Indirect/Context":      regexp.MustCompile(`(?i)(in the context of|simulate a scenario where)`),
	"Encoding/Obfuscation":  regexp.MustCompile(`([A-Za-z0-9+/]{40,}=*|\\u[0-9a-fA-F]{4})`), // Base64 or unicode
	"Exfiltration":          regexp.MustCompile(`(?i)(send data to|http[s]?://|curl|wget)`),
	"Advanced":              regexp.MustCompile(`(?i)(system override|developer mode|sudo|admin mode)`),
}

func (uc *UseCase) DetectInjection(prompt string) (float64, []model.InjectionLog) {
	score := 0.0
	var logs []model.InjectionLog

	for category, pattern := range injectionPatterns {
		if pattern.MatchString(prompt) {
			conf := 0.8
			if category == "Encoding/Obfuscation" || category == "Exfiltration" {
				conf = 0.5 // lower confidence for generic patterns
			}
			logs = append(logs, model.InjectionLog{
				ID:           uuid.New(),
				Category:     category,
				PatternMatch: pattern.FindString(prompt),
				Confidence:   conf,
			})
			score += conf
		}
	}

	if score > 0.9 {
		score = 0.9
	}
	return score, logs
}

func (uc *UseCase) Submit(ctx context.Context, userID uuid.UUID, req SubmitRequest) (SubmitResponse, error) {
	score, injLogs := uc.DetectInjection(req.Prompt)
	isBlocked := score >= 0.7

	promptLog := &model.PromptLog{
		ID:             uuid.New(),
		UserID:         userID,
		Prompt:         req.Prompt,
		InjectionScore: score,
		IsBlocked:      isBlocked,
		CreatedAt:      time.Now(),
		InjectionLogs:  injLogs,
	}

	for i := range promptLog.InjectionLogs {
		promptLog.InjectionLogs[i].PromptLogID = promptLog.ID
		promptLog.InjectionLogs[i].CreatedAt = promptLog.CreatedAt
	}

	err := uc.repo.SaveLog(ctx, promptLog)
	if err != nil {
		return SubmitResponse{}, err
	}

	return SubmitResponse{
		IsBlocked:      isBlocked,
		InjectionScore: score,
		PromptLogID:    promptLog.ID.String(),
	}, nil
}

func (uc *UseCase) ScoreLocal(ctx context.Context, req ScoreLocalRequest) error {
	return uc.repo.UpdateScores(ctx, req.PromptLogID, req.Response, req.SpeedScore, req.QualityScore, req.TotalScore)
}

func (uc *UseCase) History(ctx context.Context, userID uuid.UUID) ([]model.PromptLog, error) {
	return uc.repo.GetHistory(ctx, userID)
}

func (uc *UseCase) Metrics(ctx context.Context) (map[string]interface{}, error) {
	return uc.repo.GetMetrics(ctx)
}
