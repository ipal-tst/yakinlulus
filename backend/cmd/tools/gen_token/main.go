package main

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	secret := "dev-secret-change-in-production-make-it-long-and-random"
	claims := jwt.MapClaims{
		"sub":     "1234567890",
		"user_id": "11111111-1111-1111-1111-111111111111",
		"role":    "SISWA",
		"iat":     time.Now().Unix(),
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, _ := token.SignedString([]byte(secret))
	fmt.Println(signed)
}
