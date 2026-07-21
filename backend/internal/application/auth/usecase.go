package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"mf-mlcllm/internal/domain/model"
	"golang.org/x/crypto/bcrypt"
)

type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	GetByEmail(ctx context.Context, email string) (*model.User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*model.User, error)
}

type JWTService interface {
	GenerateTokens(userID string) (access string, refresh string, err error)
}

type UseCase struct {
	repo       UserRepository
	jwtService JWTService
}

func NewUseCase(repo UserRepository, jwt JWTService) *UseCase {
	return &UseCase{repo: repo, jwtService: jwt}
}

func (uc *UseCase) Register(ctx context.Context, req RegisterRequest) (TokenResponse, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return TokenResponse{}, err
	}

	user := &model.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hashed),
		Name:         req.Name,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	err = uc.repo.Create(ctx, user)
	if err != nil {
		return TokenResponse{}, err
	}

	acc, ref, err := uc.jwtService.GenerateTokens(user.ID.String())
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{
		AccessToken:  acc,
		RefreshToken: ref,
		User: UserDTO{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	}, nil
}

func (uc *UseCase) Login(ctx context.Context, req LoginRequest) (TokenResponse, error) {
	user, err := uc.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return TokenResponse{}, errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return TokenResponse{}, errors.New("invalid credentials")
	}

	acc, ref, err := uc.jwtService.GenerateTokens(user.ID.String())
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{
		AccessToken:  acc,
		RefreshToken: ref,
		User: UserDTO{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	}, nil
}

func (uc *UseCase) Me(ctx context.Context, userID uuid.UUID) (UserDTO, error) {
	user, err := uc.repo.GetByID(ctx, userID)
	if err != nil {
		return UserDTO{}, err
	}

	return UserDTO{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
	}, nil
}
