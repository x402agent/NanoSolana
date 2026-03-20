# ═══════════════════════════════════════════════════════════════
#  MawdAxe - Multi-stage Docker build
#  Produces a ~10MB scratch container for any platform
#
#  Build: docker build -t mawdaxe .
#  Run:   docker run -e BITAXE_IP=192.168.1.42 mawdaxe
#
#  Cross-compile for Orin Nano:
#  docker build --build-arg GOARCH=arm64 -t mawdaxe:arm64 .
# ═══════════════════════════════════════════════════════════════

FROM golang:1.22-alpine AS builder

ARG GOOS=linux
ARG GOARCH=amd64

WORKDIR /build

# Cache deps
COPY go.mod go.sum* ./
RUN go mod download 2>/dev/null || true

# Copy source
COPY . .

# Build static binary
RUN CGO_ENABLED=0 GOOS=${GOOS} GOARCH=${GOARCH} go build \
    -ldflags="-s -w -X main.version=docker" \
    -trimpath \
    -o /mawdaxe \
    ./cmd/mawdaxe/

# ─── Runtime ───
FROM scratch

COPY --from=builder /mawdaxe /mawdaxe
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8420

ENTRYPOINT ["/mawdaxe"]
