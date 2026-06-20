// apps/cms-service/handler/contest/contest_handler.go
package contest

import (
	"errors"
	"net/http"
	"time"

	contestRepo "github.com/KPV2004/gradient-backend/apps/cms-service/repository/contest"
	"github.com/KPV2004/gradient-backend/apps/shared/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ContestHandler struct {
	repo contestRepo.ContestRepository
}

func NewContestHandler(repo contestRepo.ContestRepository) *ContestHandler {
	return &ContestHandler{repo: repo}
}

type CreateContestRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description" binding:"required"`
	StartTime   time.Time `json:"start_time" binding:"required"`
	EndTime     time.Time `json:"end_time" binding:"required"`
	IsPublic    bool      `json:"is_public"`
}

func (h *ContestHandler) Create(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req CreateContestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.EndTime.Before(req.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end time must be after start time"})
		return
	}

	contest := &model.Contest{
		ID:          uuid.New().String(),
		Title:       req.Title,
		Description: req.Description,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		CreatedBy:   userID.(string),
		IsPublic:    req.IsPublic,
	}

	if err := h.repo.Create(c.Request.Context(), contest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, contest)
}

func (h *ContestHandler) GetByID(c *gin.Context) {
	id := c.Param("id")
	contest, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, contestRepo.ErrContestNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "contest not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, contest)
}

func (h *ContestHandler) List(c *gin.Context) {
	contests, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, contests)
}

func (h *ContestHandler) Join(c *gin.Context) {
	contestID := c.Param("id")
	userID, _ := c.Get("userID")

	// Validate contest exists
	_, err := h.repo.GetByID(c.Request.Context(), contestID)
	if err != nil {
		if errors.Is(err, contestRepo.ErrContestNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "contest not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.Join(c.Request.Context(), contestID, userID.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "joined contest successfully"})
}

type AddProblemRequest struct {
	ProblemID  string `json:"problem_id" binding:"required"`
	Label      string `json:"label" binding:"required"`
	OrderIndex int    `json:"order_index" binding:"required"`
}

func (h *ContestHandler) AddProblem(c *gin.Context) {
	contestID := c.Param("id")

	var req AddProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate contest exists
	_, err := h.repo.GetByID(c.Request.Context(), contestID)
	if err != nil {
		if errors.Is(err, contestRepo.ErrContestNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "contest not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	cp := &model.ContestProblem{
		ContestID:  contestID,
		ProblemID:  req.ProblemID,
		Label:      req.Label,
		OrderIndex: req.OrderIndex,
	}

	if err := h.repo.AddProblem(c.Request.Context(), cp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cp)
}

func (h *ContestHandler) GetProblems(c *gin.Context) {
	contestID := c.Param("id")
	userID, _ := c.Get("userID")
	userRole, _ := c.Get("userRole")

	contest, err := h.repo.GetByID(c.Request.Context(), contestID)
	if err != nil {
		if errors.Is(err, contestRepo.ErrContestNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "contest not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// If contest is private, check if user is a participant or is admin/teacher
	if !contest.IsPublic && userRole.(model.Role) != model.RoleAdmin && userRole.(model.Role) != model.RoleTeacher {
		isJoined, err := h.repo.IsParticipant(c.Request.Context(), contestID, userID.(string))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !isJoined {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: you must join this contest first"})
			return
		}
	}

	problems, err := h.repo.GetProblems(c.Request.Context(), contestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, problems)
}
