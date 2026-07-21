package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"mf-mlcllm/internal/shared/config"
)

type JWTService struct {
	secret     []byte
	expiration time.Duration
	issuer     string
}

func NewJWTService(cfg config.JWTConfig) *JWTService {
	return &JWTService{
		secret:     []byte(cfg.Secret),
		expiration: time.Duration(cfg.ExpirationHours) * time.Hour,
		issuer:     cfg.Issuer,
	}
}

type customClaims struct {
	jwt.RegisteredClaims
	UserID string `json:"user_id"`
}

func (s *JWTService) GenerateTokens(userID string) (string, string, error) {
	now := time.Now()
	
	// Access Token
	c := customClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiration)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
		UserID: userID,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	access, err := token.SignedString(s.secret)
	if err != nil {
		return "", "", fmt.Errorf("sign access token: %w", err)
	}

	// Refresh Token
	cRefresh := customClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiration * 24)), // 24 times longer
			IssuedAt:  jwt.NewNumericDate(now),
		},
		UserID: userID,
	}
	rToken := jwt.NewWithClaims(jwt.SigningMethodHS256, cRefresh)
	refresh, err := rToken.SignedString(s.secret)
	if err != nil {
		return "", "", fmt.Errorf("sign refresh token: %w", err)
	}

	return access, refresh, nil
}
