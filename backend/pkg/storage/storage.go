package storage

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// Client uploads files to Supabase Storage via its REST API.
// Supabase S3-compatible endpoint carries a URL path (/storage/v1/s3),
// which the minio-go client rejects, so we talk REST directly.
type Client struct {
	httpClient    *http.Client
	baseURL       string // e.g. https://<project>.supabase.co/storage/v1
	apikey        string
	bucket        string
	publicBaseURL string
}

func NewClient(endpoint, accessKey, bucket, publicBaseURL string) (*Client, error) {
	baseURL := strings.TrimSuffix(endpoint, "/")
	if !strings.Contains(baseURL, "/storage") {
		baseURL += "/storage/v1"
	}
	return &Client{
		httpClient:    &http.Client{},
		baseURL:       baseURL,
		apikey:        accessKey,
		bucket:        bucket,
		publicBaseURL: publicBaseURL,
	}, nil
}

func (c *Client) Upload(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("%s/object/%s/%s", c.baseURL, c.bucket, objectName), reader)
	if err != nil {
		return "", fmt.Errorf("storage request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.apikey)
	req.Header.Set("x-upsert", "true")
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("storage upload: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return "", fmt.Errorf("storage upload failed (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	if c.publicBaseURL != "" {
		return fmt.Sprintf("%s/%s/%s", strings.TrimSuffix(c.publicBaseURL, "/"), c.bucket, objectName), nil
	}
	return fmt.Sprintf("/api/v1/media/serve/%s", objectName), nil
}

func (c *Client) Delete(ctx context.Context, objectName string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, fmt.Sprintf("%s/object/%s/%s", c.baseURL, c.bucket, objectName), nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apikey)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("storage delete failed (%d)", resp.StatusCode)
	}
	return nil
}

func (c *Client) GetBucket() string {
	return c.bucket
}
