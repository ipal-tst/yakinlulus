package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func testLogin(email, password string) {
	fmt.Printf("Testing login for email: %q ... ", email)
	payload, _ := json.Marshal(loginReq{Email: email, Password: password})

	resp, err := http.Post("http://localhost:8080/api/v1/auth/login", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		fmt.Printf("❌ Failed to send request: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusOK {
		fmt.Printf("✅ SUCCESS (%d)\nResponse: %s\n\n", resp.StatusCode, string(body))
	} else {
		fmt.Printf("❌ FAILED (%d)\nResponse: %s\n\n", resp.StatusCode, string(body))
		os.Exit(1)
	}
}

func main() {
	testLogin("admin@yakinlulus.id", "Admin@123!")
	testLogin("murid@yakinlulus.id", "Admin@123!")
	testLogin("guru.budi@yakinlulus.id", "Admin@123!")
	testLogin("  ADMIN@YakinLulus.ID  ", "Admin@123!")
}
