// apps/cms-service/handler/auth/auth_handler.go
package auth

import (
	"errors"
	"net/http"
	"time"

	"github.com/KPV2004/gradient-backend/apps/cms-service/config"
	authRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/auth"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	repo authRepo.UserRepository
	cfg  *config.Config
}

func NewAuthHandler(repo authRepo.UserRepository, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		repo: repo,
		cfg:  cfg,
	}
}

type RegisterRequest struct {
	Username    string     `json:"username" binding:"required,min=3"`
	Email       string     `json:"email" binding:"required,email"`
	Password    string     `json:"password" binding:"required,min=6"`
	DisplayName string     `json:"display_name" binding:"required"`
	Role        model.Role `json:"role"` // Optional, defaults to student
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"` // Can be username or email
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if role is valid
	if req.Role == "" {
		req.Role = model.RoleStudent
	} else if req.Role != model.RoleStudent && req.Role != model.RoleTeacher && req.Role != model.RoleAdmin {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// Check if username or email already exists
	_, err = h.repo.GetByUsername(c.Request.Context(), req.Username)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
		return
	}
	_, err = h.repo.GetByEmail(c.Request.Context(), req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
		return
	}

	user := &model.User{
		ID:           uuid.New().String(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		DisplayName:  req.DisplayName,
		Role:         req.Role,
	}

	if err := h.repo.Create(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "registration successful",
		"user_id":      user.ID,
		"username":     user.Username,
		"display_name": user.DisplayName,
		"role":         user.Role,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Try fetching by username first, then by email
	user, err := h.repo.GetByUsername(c.Request.Context(), req.Username)
	if err != nil {
		if errors.Is(err, authRepo.ErrUserNotFound) {
			user, err = h.repo.GetByEmail(c.Request.Context(), req.Username)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username/email or password"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username/email or password"})
		return
	}

	// Generate JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID": user.ID,
		"role":   string(user.Role),
		"exp":    time.Now().Add(h.cfg.JWTExpires).Unix(),
	})

	tokenString, err := token.SignedString([]byte(h.cfg.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"display_name": user.DisplayName,
			"role":         user.Role,
		},
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := h.repo.GetByID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           user.ID,
		"username":     user.Username,
		"display_name": user.DisplayName,
		"role":         user.Role,
		"email":        user.Email,
	})
}
