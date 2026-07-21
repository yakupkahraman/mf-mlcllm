package llm

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"mf-mlcllm/internal/application/llm"
	appMiddleware "mf-mlcllm/internal/infrastructure/http/middleware"
)

var validate = validator.New()

type Handler struct {
	uc *llm.UseCase
}

func NewHandler(uc *llm.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Submit(w http.ResponseWriter, r *http.Request) {
	userID, ok := appMiddleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req llm.SubmitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := validate.Struct(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.uc.Submit(r.Context(), userID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) ScoreLocal(w http.ResponseWriter, r *http.Request) {
	userID, ok := appMiddleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req llm.ScoreLocalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := validate.Struct(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := h.uc.ScoreLocal(r.Context(), req, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) History(w http.ResponseWriter, r *http.Request) {
	userID, ok := appMiddleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	logs, err := h.uc.History(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func (h *Handler) Metrics(w http.ResponseWriter, r *http.Request) {
	metrics, err := h.uc.Metrics(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

func (h *Handler) DetailedMetrics(w http.ResponseWriter, r *http.Request) {
	metrics, err := h.uc.DetailedMetrics(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}
