package gamification

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestComputeLevel(t *testing.T) {
	tests := []struct {
		totalXP int
		want    int
	}{
		{0, 1},
		{1, 1},
		{999, 1},
		{1000, 2},
		{1500, 2},
		{2000, 3},
		{5000, 6},
		{10000, 11},
		{999999, 1000},
	}

	for _, tt := range tests {
		got := computeLevel(tt.totalXP)
		assert.Equal(t, tt.want, got, "computeLevel(%d)", tt.totalXP)
	}
}

func TestComputeLevelProgress(t *testing.T) {
	tests := []struct {
		totalXP       int
		wantLevel     int
		wantCurrentXP int
		wantPct       float64
	}{
		{0, 1, 0, 0},
		{500, 1, 500, 50},
		{1000, 2, 0, 0},
		{1500, 2, 500, 50},
		{2000, 3, 0, 0},
		{2500, 3, 500, 50},
		{3333, 4, 333, 33.3},
		{5000, 6, 0, 0},
	}

	for _, tt := range tests {
		level, currentXP, pct := computeLevelProgress(tt.totalXP)
		assert.Equal(t, tt.wantLevel, level, "computeLevelProgress(%d).level", tt.totalXP)
		assert.Equal(t, tt.wantCurrentXP, currentXP, "computeLevelProgress(%d).currentXP", tt.totalXP)
		assert.InDelta(t, tt.wantPct, pct, 0.01, "computeLevelProgress(%d).pct", tt.totalXP)
	}
}

func TestComputeLevelExactBoundaries(t *testing.T) {
	for n := 0; n <= 10; n++ {
		total := n * 1000
		expectedLevel := n + 1
		assert.Equal(t, expectedLevel, computeLevel(total), "boundary %d XP = level %d", total, expectedLevel)
	}
}

func TestComputeLevelFloatConsistency(t *testing.T) {
	assert.Equal(t, 1, computeLevel(0))
	assert.Equal(t, 1, computeLevel(999))
	assert.Equal(t, 2, computeLevel(1000))
	assert.Equal(t, 10, computeLevel(9000))
	assert.Equal(t, 11, computeLevel(10000))
	assert.Equal(t, computeLevel(math.MaxInt32), math.MaxInt32/1000+1)
}
