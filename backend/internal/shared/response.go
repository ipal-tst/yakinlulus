package shared

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type APIResponse struct {
	Success   bool            `json:"success"`
	Message   string          `json:"message"`
	Data      interface{}     `json:"data,omitempty"`
	Meta      *PaginationMeta `json:"meta,omitempty"`
	Errors    []ErrorItem     `json:"errors,omitempty"`
	ErrorCode string          `json:"error_code,omitempty"`
}

type PaginationMeta struct {
	Page        int  `json:"page"`
	Limit       int  `json:"limit"`
	Total       int  `json:"total"`
	TotalPages  int  `json:"total_pages"`
	HasNext     bool `json:"has_next"`
	HasPrevious bool `json:"has_previous"`
}

type ErrorItem struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

type ErrorCode string

const (
	ErrValidation              ErrorCode = "VALIDATION_ERROR"
	ErrUnauthorized            ErrorCode = "UNAUTHORIZED"
	ErrForbidden               ErrorCode = "FORBIDDEN"
	ErrNotFound                ErrorCode = "NOT_FOUND"
	ErrConflict                ErrorCode = "CONFLICT"
	ErrInternal                ErrorCode = "INTERNAL_ERROR"
	ErrMaxAttemptsReached      ErrorCode = "MAX_ATTEMPTS_REACHED"
	ErrExamNotStarted          ErrorCode = "EXAM_NOT_STARTED"
	ErrExamFinished            ErrorCode = "EXAM_FINISHED"
	ErrAttemptAlreadySubmitted ErrorCode = "ATTEMPT_ALREADY_SUBMITTED"
)

func Success(data interface{}) APIResponse {
	return APIResponse{Success: true, Data: data}
}

func SuccessWithMeta(data interface{}, meta *PaginationMeta) APIResponse {
	return APIResponse{Success: true, Data: data, Meta: meta}
}

func Error(code ErrorCode, message string) APIResponse {
	return APIResponse{Success: false, ErrorCode: string(code), Message: message}
}

func ValidationError(errs []ErrorItem) APIResponse {
	return APIResponse{Success: false, ErrorCode: string(ErrValidation), Message: "Validation failed", Errors: errs}
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	msg := "Internal server error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		msg = e.Message
	}

	return c.Status(code).JSON(Error(parseCode(code), msg))
}

func parseCode(code int) ErrorCode {
	switch code {
	case 400:
		return ErrValidation
	case 401:
		return ErrUnauthorized
	case 403:
		return ErrForbidden
	case 404:
		return ErrNotFound
	case 409:
		return ErrConflict
	default:
		return ErrInternal
	}
}

func ParsePagination(c *fiber.Ctx) (page, limit int) {
	page = c.QueryInt("page", 1)
	limit = c.QueryInt("limit", 20)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 1000 {
		limit = 20
	}
	return
}

func BuildMeta(page, limit, total int) *PaginationMeta {
	totalPages := (total + limit - 1) / limit
	return &PaginationMeta{
		Page:        page,
		Limit:       limit,
		Total:       total,
		TotalPages:  totalPages,
		HasNext:     page < totalPages,
		HasPrevious: page > 1,
	}
}

func ParseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
