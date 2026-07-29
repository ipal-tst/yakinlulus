package shared

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSuccess(t *testing.T) {
	data := map[string]string{"key": "value"}
	resp := Success(data)

	assert.True(t, resp.Success)
	assert.Equal(t, data, resp.Data)
	assert.Empty(t, resp.Message)
	assert.Nil(t, resp.Meta)
	assert.Nil(t, resp.Errors)
	assert.Empty(t, resp.ErrorCode)
}

func TestSuccessWithDataNil(t *testing.T) {
	resp := Success(nil)
	assert.True(t, resp.Success)
	assert.Nil(t, resp.Data)
}

func TestError(t *testing.T) {
	resp := Error(ErrNotFound, "resource not found")

	assert.False(t, resp.Success)
	assert.Equal(t, "NOT_FOUND", resp.ErrorCode)
	assert.Equal(t, "resource not found", resp.Message)
	assert.Nil(t, resp.Data)
	assert.Nil(t, resp.Meta)
	assert.Nil(t, resp.Errors)
}

func TestBuildMeta(t *testing.T) {
	meta := BuildMeta(1, 20, 100)

	assert.Equal(t, 1, meta.Page)
	assert.Equal(t, 20, meta.Limit)
	assert.Equal(t, 100, meta.Total)
	assert.Equal(t, 5, meta.TotalPages)
	assert.True(t, meta.HasNext)
	assert.False(t, meta.HasPrevious)
}

func TestBuildMetaFirstPageNoNext(t *testing.T) {
	meta := BuildMeta(1, 20, 15)
	assert.Equal(t, 1, meta.TotalPages)
	assert.False(t, meta.HasNext)
	assert.False(t, meta.HasPrevious)
}

func TestBuildMetaMiddlePage(t *testing.T) {
	meta := BuildMeta(3, 10, 50)
	assert.Equal(t, 5, meta.TotalPages)
	assert.True(t, meta.HasNext)
	assert.True(t, meta.HasPrevious)
}

func TestBuildMetaLastPage(t *testing.T) {
	meta := BuildMeta(5, 10, 50)
	assert.Equal(t, 5, meta.TotalPages)
	assert.False(t, meta.HasNext)
	assert.True(t, meta.HasPrevious)
}

func TestBuildMetaZeroTotal(t *testing.T) {
	meta := BuildMeta(1, 20, 0)
	assert.Equal(t, 0, meta.TotalPages)
	assert.False(t, meta.HasNext)
	assert.False(t, meta.HasPrevious)
}

func TestBuildMetaExactDivision(t *testing.T) {
	meta := BuildMeta(1, 10, 30)
	assert.Equal(t, 3, meta.TotalPages)
	assert.True(t, meta.HasNext)
}

func TestValidationError(t *testing.T) {
	errs := []ErrorItem{
		{Field: "email", Message: "required"},
	}
	resp := ValidationError(errs)

	assert.False(t, resp.Success)
	assert.Equal(t, "VALIDATION_ERROR", resp.ErrorCode)
	assert.Equal(t, "Validation failed", resp.Message)
	assert.Equal(t, errs, resp.Errors)
}
