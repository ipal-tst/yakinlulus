package ranking

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestParseMonth(t *testing.T) {
	got, err := parseMonth("2026-08")
	assert.NoError(t, err)
	assert.Equal(t, time.Date(2026, 8, 1, 0, 0, 0, 0, time.UTC), got)

	_, err = parseMonth("2026-13")
	assert.Error(t, err)
	_, err = parseMonth("august")
	assert.Error(t, err)
	_, err = parseMonth("")
	assert.Error(t, err)
}

func TestBuildRanking(t *testing.T) {
	u1 := uuid.New()
	u2 := uuid.New()
	raw := []rawScore{
		{u1, "Andi", "SMPN 1", "math", 90},
		{u1, "Andi", "SMPN 1", "indo", 80},
		{u1, "Andi", "SMPN 1", "eng", 70},
		{u2, "Budi", "SMPN 2", "math", 85},
		{u2, "Budi", "SMPN 2", "indo", 85},
		{u2, "Budi", "SMPN 2", "eng", 60},
	}
	rows := buildRanking(raw, 3)
	assert.Len(t, rows, 2)

	// Andi total 240, average 80; Budi total 230, average 76.67 -> Andi first
	assert.Equal(t, 1, rows[0].Rank)
	assert.Equal(t, u1, rows[0].UserID)
	assert.Equal(t, 240.0, rows[0].Total)
	assert.InDelta(t, 80.0, rows[0].Average, 0.01)
	assert.Equal(t, 90.0, rows[0].SubjectScores["math"])
	assert.Equal(t, "SMPN 1", rows[0].SchoolName)

	assert.Equal(t, 2, rows[1].Rank)
	assert.Equal(t, u2, rows[1].UserID)
}

func TestBuildRankingEmpty(t *testing.T) {
	rows := buildRanking(nil, 3)
	assert.Empty(t, rows)
}

func TestBuildRankingBestPerSubject(t *testing.T) {
	u := uuid.New()
	// same user twice for same subject -> keep max
	raw := []rawScore{
		{u, "Andi", "SMPN 1", "math", 70},
		{u, "Andi", "SMPN 1", "math", 95},
	}
	rows := buildRanking(raw, 2)
	assert.Len(t, rows, 1)
	assert.Equal(t, 95.0, rows[0].SubjectScores["math"])
	assert.Equal(t, 95.0, rows[0].Total)
}
