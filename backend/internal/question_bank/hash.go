package question_bank

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"
)

var (
	htmlRegex  = regexp.MustCompile(`<[^>]*>`)
	mdImgRegex = regexp.MustCompile(`!\[.*?\]\(.*?\)`)
	urlRegex   = regexp.MustCompile(`https?://\S+|/uploads/\S+`)
	spaceRegex = regexp.MustCompile(`\s+`)
)

// NormalizeText removes HTML tags, markdown images, URLs, lowers case, and collapses whitespace.
func NormalizeText(input string) string {
	cleaned := htmlRegex.ReplaceAllString(input, "")
	cleaned = mdImgRegex.ReplaceAllString(cleaned, "")
	cleaned = urlRegex.ReplaceAllString(cleaned, "")
	cleaned = strings.ToLower(cleaned)
	cleaned = spaceRegex.ReplaceAllString(cleaned, " ")
	return strings.TrimSpace(cleaned)
}

// CalculateContentHash computes a deterministic SHA-256 hash for a question and its options.
func CalculateContentHash(content string, options []QuestionOption) string {
	normContent := NormalizeText(content)
	optContents := make([]string, 0, len(options))
	for _, opt := range options {
		optContents = append(optContents, NormalizeText(opt.Content))
	}

	rawString := normContent + "|" + strings.Join(optContents, "|")
	hash := sha256.Sum256([]byte(rawString))
	return hex.EncodeToString(hash[:])
}
