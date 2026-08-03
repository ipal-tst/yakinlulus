package main

import (
	"fmt"
	"log"

	"yakinlulus.id/backend/pkg/config"
)

func main() {
	cfg, err := config.Load("config.yaml")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Database URL: %s\n", cfg.Database.URL)
}
