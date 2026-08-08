package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type TestResult struct {
	ModuleName     string        `json:"module"`
	EndpointName   string        `json:"endpoint"`
	Method         string        `json:"method"`
	Path           string        `json:"path"`
	ExpectedRole   string        `json:"expected_role"`
	StatusCode     int           `json:"status_code"`
	ExpectedStatus int           `json:"expected_status"`
	Passed         bool          `json:"passed"`
	Latency        time.Duration `json:"latency_ms"`
	Message        string        `json:"message"`
	ResponseBody   string        `json:"response_body,omitempty"`
}

type QAClient struct {
	BaseURL    string
	HTTPClient *http.Client
	Tokens     map[string]string // role -> token
}

func NewQAClient(baseURL string) *QAClient {
	return &QAClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		Tokens: make(map[string]string),
	}
}

func (c *QAClient) Login(role, email, password string) error {
	payload := map[string]string{"email": email, "password": password}
	body, _ := json.Marshal(payload)
	resp, err := c.HTTPClient.Post(c.BaseURL+"/auth/login", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("login request failed for %s: %v", role, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("login failed status %d: %s", resp.StatusCode, string(respBytes))
	}

	var res struct {
		Data struct {
			AccessToken string `json:"access_token"`
			Token       string `json:"token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return fmt.Errorf("decode login response: %v", err)
	}

	token := res.Data.AccessToken
	if token == "" {
		token = res.Data.Token
	}
	c.Tokens[role] = token
	return nil
}

func (c *QAClient) TestEndpoint(module, name, method, path, role string, expectedCode int, reqBody interface{}) TestResult {
	start := time.Now()
	var bodyReader io.Reader
	if reqBody != nil {
		b, _ := json.Marshal(reqBody)
		bodyReader = bytes.NewBuffer(b)
	}

	req, err := http.NewRequest(method, c.BaseURL+path, bodyReader)
	if err != nil {
		return TestResult{
			ModuleName: module, EndpointName: name, Method: method, Path: path,
			ExpectedRole: role, ExpectedStatus: expectedCode, Passed: false,
			Message: err.Error(),
		}
	}

	if reqBody != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	if role != "UNAUTH" {
		if token, ok := c.Tokens[role]; ok && token != "" {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}

	resp, err := c.HTTPClient.Do(req)
	latency := time.Since(start)

	if err != nil {
		return TestResult{
			ModuleName: module, EndpointName: name, Method: method, Path: path,
			ExpectedRole: role, ExpectedStatus: expectedCode, Passed: false,
			Latency: latency, Message: err.Error(),
		}
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	passed := resp.StatusCode == expectedCode

	msg := "OK"
	if !passed {
		msg = fmt.Sprintf("Expected status %d, got %d", expectedCode, resp.StatusCode)
	}

	return TestResult{
		ModuleName: module, EndpointName: name, Method: method, Path: path,
		ExpectedRole: role, StatusCode: resp.StatusCode, ExpectedStatus: expectedCode,
		Passed: passed, Latency: latency, Message: msg, ResponseBody: string(respBytes),
	}
}
