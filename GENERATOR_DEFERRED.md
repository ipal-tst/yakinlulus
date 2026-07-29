# Generator Service — Deferred

**See**: `../Yakinlulus.generator/DESIGN.md`

This directory contains the generator service implementation (deferred).
Platform DB unification (migration 023) takes priority.

When ready to implement:
```bash
cd ../Yakinlulus.generator
go mod tidy
go run cmd/generator/main.go migrate
go run cmd/generator/main.go serve
```