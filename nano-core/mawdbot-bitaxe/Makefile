# MawdAxe - Build Targets
# 
# make build          → Local binary
# make build-all      → All platforms (x86, ARM64, RISC-V)
# make docker         → Docker image
# make install        → Build + install service
# make dev            → Run in development mode

VERSION := $(shell git describe --tags 2>/dev/null || echo "dev")
LDFLAGS := -s -w -X main.version=$(VERSION)
BINARY := mawdaxe

.PHONY: build build-all docker install dev clean

# ─── Build ───────────────────────────────────────────────────────

build:
	CGO_ENABLED=0 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/$(BINARY) ./cmd/mawdaxe/
	@echo "Built: bin/$(BINARY) ($$(du -h bin/$(BINARY) | cut -f1))"

build-all: build-linux-amd64 build-linux-arm64 build-linux-riscv64 build-darwin-arm64
	@echo "All platforms built."

build-linux-amd64:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/$(BINARY)-linux-amd64 ./cmd/mawdaxe/

build-linux-arm64:
	CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/$(BINARY)-linux-arm64 ./cmd/mawdaxe/

build-linux-riscv64:
	CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/$(BINARY)-linux-riscv64 ./cmd/mawdaxe/

build-darwin-arm64:
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 go build -ldflags="$(LDFLAGS)" -trimpath -o bin/$(BINARY)-darwin-arm64 ./cmd/mawdaxe/

# ─── Docker ──────────────────────────────────────────────────────

docker:
	docker build -t mawdaxe:$(VERSION) -t mawdaxe:latest .

docker-arm64:
	docker build --build-arg GOARCH=arm64 -t mawdaxe:$(VERSION)-arm64 .

# ─── Development ─────────────────────────────────────────────────

dev:
	@cp -n .env.example .env 2>/dev/null || true
	go run ./cmd/mawdaxe/

# ─── Install ─────────────────────────────────────────────────────

install: build
	chmod +x scripts/setup.sh
	./scripts/setup.sh

# ─── Fleet (with Supabase + Tailscale) ───────────────────────────

fleet-up:
	docker compose up -d

fleet-mesh:
	docker compose --profile mesh up -d

fleet-monitoring:
	docker compose --profile monitoring up -d

fleet-all:
	docker compose --profile mesh --profile monitoring up -d

# ─── Clean ───────────────────────────────────────────────────────

clean:
	rm -rf bin/
	docker rmi mawdaxe:latest 2>/dev/null || true
