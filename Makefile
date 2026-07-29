.PHONY: setup build run test lint migrate-up migrate-down seed clean docker-up docker-down

# === Backend Commands ===

setup:
	cd backend && go mod tidy

build:
	cd backend && go build -o yakinlulus-api ./cmd/api

run:
	cd backend && go run ./cmd/api/main.go

test:
	cd backend && go test ./... -count=1

vet:
	cd backend && go vet ./...

lint:
	cd backend && golangci-lint run 2>/dev/null || echo "golangci-lint not installed"

tidy:
	cd backend && go mod tidy

migrate-up:
	cd backend && go run ./cmd/migrate/main.go up

migrate-down:
	cd backend && go run ./cmd/migrate/main.go down

migrate-status:
	cd backend && go run ./cmd/migrate/main.go status

seed:
	cd backend && go run ./cmd/seed/main.go

clean:
	rm -f backend/yakinlulus-api

# === Docker ===

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

# === Frontend ===

frontend-setup:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-clean:
	cd frontend && rm -rf .next

# === Full Check ===

check: tidy build vet test
	@echo "=== All checks passed ==="
