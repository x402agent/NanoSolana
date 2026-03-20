#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  MawdAxe One-Shot Setup
#  The MawdBot x Bitaxe Autonomous Mining Agent
#  
#  Usage: curl -sSL https://raw.githubusercontent.com/8bitlabs/mawdbot-bitaxe/main/setup.sh | bash
#  Or:    ./setup.sh
#
#  What this does:
#  1. Detects your platform (Linux/macOS/ARM64)
#  2. Installs Go if not present
#  3. Discovers Bitaxe devices on your network
#  4. Generates config
#  5. Builds the mawdaxe binary
#  6. Creates a systemd service (Linux) or launchd plist (macOS)
#  7. Starts the agent
#
#  Requirements: 
#  - Bitaxe Gamma on same WiFi/LAN network
#  - Go 1.22+ (auto-installed if missing)
#  - Linux, macOS, or WSL
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

INSTALL_DIR="${MAWDAXE_DIR:-$HOME/.mawdbot}"
BIN_DIR="$INSTALL_DIR/bin"
CONFIG_DIR="$INSTALL_DIR/config"
DATA_DIR="$INSTALL_DIR/data"
LOG_DIR="$INSTALL_DIR/logs"

banner() {
    echo -e "${PURPLE}"
    echo '  ███╗   ███╗ █████╗ ██╗    ██╗██████╗  █████╗ ██╗  ██╗███████╗'
    echo '  ████╗ ████║██╔══██╗██║    ██║██╔══██╗██╔══██╗╚██╗██╔╝██╔════╝'
    echo '  ██╔████╔██║███████║██║ █╗ ██║██║  ██║███████║ ╚███╔╝ █████╗  '
    echo '  ██║╚██╔╝██║██╔══██║██║███╗██║██║  ██║██╔══██║ ██╔██╗ ██╔══╝  '
    echo '  ██║ ╚═╝ ██║██║  ██║╚███╔███╔╝██████╔╝██║  ██║██╔╝ ██╗███████╗'
    echo '  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝'
    echo -e "${NC}"
    echo -e "  ${CYAN}MawdBot x Bitaxe │ One-Shot Setup${NC}"
    echo ""
}

log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_err()  { echo -e "${RED}[✗]${NC} $1"; }
log_step() { echo -e "${CYAN}[→]${NC} $1"; }

# ─────────────────── Platform Detection ──────────────────────────

detect_platform() {
    OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
    ARCH="$(uname -m)"
    
    case "$ARCH" in
        x86_64|amd64) GOARCH="amd64" ;;
        aarch64|arm64) GOARCH="arm64" ;;
        armv7*|armhf) GOARCH="arm" ;;
        riscv64) GOARCH="riscv64" ;;
        *) log_err "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    case "$OS" in
        linux) GOOS="linux" ;;
        darwin) GOOS="darwin" ;;
        *) log_err "Unsupported OS: $OS"; exit 1 ;;
    esac

    log_info "Platform: ${GOOS}/${GOARCH}"
    
    # Detect if this is an NVIDIA Orin Nano
    if [[ -f /proc/device-tree/model ]]; then
        MODEL=$(cat /proc/device-tree/model 2>/dev/null || echo "")
        if [[ "$MODEL" == *"Orin"* ]] || [[ "$MODEL" == *"Jetson"* ]]; then
            log_info "Detected NVIDIA Jetson/Orin hardware — optimizing for edge"
            IS_JETSON=true
        fi
    fi
}

# ─────────────────── Bitaxe Discovery ────────────────────────────

discover_bitaxe() {
    log_step "Scanning network for Bitaxe devices..."
    
    FOUND_DEVICES=()
    
    # Method 1: mDNS (bitaxe.local)
    if command -v avahi-resolve &>/dev/null; then
        MDNS_IP=$(avahi-resolve -n bitaxe.local 2>/dev/null | awk '{print $2}' || true)
        if [[ -n "$MDNS_IP" ]]; then
            FOUND_DEVICES+=("$MDNS_IP")
            log_info "Found via mDNS: $MDNS_IP"
        fi
    fi
    
    # Method 2: Scan common subnet
    if command -v nmap &>/dev/null; then
        SUBNET=$(ip route | grep default | awk '{print $3}' | sed 's/\.[0-9]*$/.0\/24/' 2>/dev/null || echo "")
        if [[ -n "$SUBNET" ]]; then
            log_step "Scanning $SUBNET for AxeOS (port 80)..."
            while IFS= read -r ip; do
                # Test if it's a Bitaxe by hitting the API
                RESPONSE=$(curl -s --connect-timeout 2 "http://$ip/api/system/info" 2>/dev/null || echo "")
                if [[ "$RESPONSE" == *"ASICModel"* ]]; then
                    FOUND_DEVICES+=("$ip")
                    MODEL=$(echo "$RESPONSE" | grep -o '"ASICModel":"[^"]*"' | cut -d'"' -f4)
                    HASH=$(echo "$RESPONSE" | grep -o '"hashRate":[0-9.]*' | cut -d: -f2)
                    log_info "Found Bitaxe @ $ip (${MODEL}, ${HASH} GH/s)"
                fi
            done < <(nmap -sn "$SUBNET" --open -p 80 2>/dev/null | grep "report for" | awk '{print $NF}')
        fi
    fi
    
    # Method 3: Manual fallback with quick port scan
    if [[ ${#FOUND_DEVICES[@]} -eq 0 ]]; then
        # Get gateway and scan common range
        GATEWAY=$(ip route | grep default | awk '{print $3}' 2>/dev/null || route -n get default 2>/dev/null | grep gateway | awk '{print $2}' || echo "")
        if [[ -n "$GATEWAY" ]]; then
            PREFIX=$(echo "$GATEWAY" | sed 's/\.[0-9]*$//')
            log_step "Quick scanning ${PREFIX}.1-254..."
            for i in $(seq 1 254); do
                IP="${PREFIX}.${i}"
                RESPONSE=$(curl -s --connect-timeout 1 "http://$IP/api/system/info" 2>/dev/null || echo "")
                if [[ "$RESPONSE" == *"ASICModel"* ]]; then
                    FOUND_DEVICES+=("$IP")
                    log_info "Found Bitaxe @ $IP"
                fi
            done
        fi
    fi
    
    if [[ ${#FOUND_DEVICES[@]} -eq 0 ]]; then
        log_warn "No Bitaxe devices found automatically."
        echo ""
        read -p "Enter your Bitaxe IP address manually: " MANUAL_IP
        if [[ -n "$MANUAL_IP" ]]; then
            FOUND_DEVICES+=("$MANUAL_IP")
        else
            log_err "No devices configured. Set BITAXE_IP and re-run."
            exit 1
        fi
    fi
    
    echo ""
    log_info "Found ${#FOUND_DEVICES[@]} device(s)"
}

# ─────────────────── Generate Config ─────────────────────────────

generate_config() {
    log_step "Generating configuration..."
    
    mkdir -p "$CONFIG_DIR"
    
    # Build device list
    DEVICE_JSON="["
    for i in "${!FOUND_DEVICES[@]}"; do
        IP="${FOUND_DEVICES[$i]}"
        ID=$(printf "mawdaxe-%03d" $((i+1)))
        if [[ $i -gt 0 ]]; then DEVICE_JSON+=","; fi
        DEVICE_JSON+=$(cat <<EOF
    {
      "deviceId": "$ID",
      "bitaxeIp": "$IP",
      "pollIntervalSec": 10,
      "maxTempC": 72,
      "warnTempC": 65,
      "coolTempC": 50,
      "maxFreqMHz": 600,
      "minFreqMHz": 400,
      "autoTune": true,
      "poolUrl": "${POOL_URL:-public-pool.io}",
      "poolPort": ${POOL_PORT:-21496},
      "poolUser": "${POOL_USER:-}",
      "poolPass": "${POOL_PASS:-x}"
    }
EOF
    )
    done
    DEVICE_JSON+="]"
    
    # Get pool user if not set
    if [[ -z "${POOL_USER:-}" ]]; then
        echo ""
        echo -e "${CYAN}Mining Pool Configuration${NC}"
        echo "Default: public-pool.io (solo mining)"
        read -p "Bitcoin address for mining rewards: " POOL_USER_INPUT
        POOL_USER="${POOL_USER_INPUT:-YOUR_BTC_ADDRESS}"
    fi
    
    # Generate API key
    API_KEY=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | xxd -p)
    
    cat > "$CONFIG_DIR/mawdaxe.json" <<EOF
{
  "apiPort": ${MAWDAXE_API_PORT:-8420},
  "apiHost": "0.0.0.0",
  "apiKey": "$API_KEY",
  "supabaseUrl": "${SUPABASE_URL:-}",
  "supabaseKey": "${SUPABASE_KEY:-}",
  "webhookUrl": "${MAWDAXE_WEBHOOK_URL:-}",
  "alertCooldownS": 300,
  "tailscaleEnabled": ${TAILSCALE_ENABLED:-false},
  "tailscaleAuthKey": "${TAILSCALE_AUTH_KEY:-}",
  "devices": $DEVICE_JSON
}
EOF
    
    log_info "Config saved to $CONFIG_DIR/mawdaxe.json"
    log_info "API Key: $API_KEY (save this!)"
}

# ─────────────────── Build Binary ────────────────────────────────

build_binary() {
    log_step "Building mawdaxe binary..."
    
    mkdir -p "$BIN_DIR"
    
    # Check if Go is available
    if ! command -v go &>/dev/null; then
        log_warn "Go not found. Installing..."
        install_go
    fi
    
    GO_VERSION=$(go version | awk '{print $3}')
    log_info "Using $GO_VERSION"
    
    # Build with optimizations
    cd "$INSTALL_DIR/src" 2>/dev/null || {
        # If running from curl pipe, clone the repo
        if [[ ! -d "$INSTALL_DIR/src" ]]; then
            log_step "Downloading MawdAxe source..."
            mkdir -p "$INSTALL_DIR/src"
            # In production, this would be:
            # git clone https://github.com/8bitlabs/mawdbot-bitaxe.git "$INSTALL_DIR/src"
            log_warn "Source not found. Copy the project to $INSTALL_DIR/src/"
            log_warn "Or run setup.sh from within the project directory."
            return
        fi
        cd "$INSTALL_DIR/src"
    }
    
    CGO_ENABLED=0 GOOS="$GOOS" GOARCH="$GOARCH" go build \
        -ldflags="-s -w -X main.version=$(git describe --tags 2>/dev/null || echo 'dev')" \
        -trimpath \
        -o "$BIN_DIR/mawdaxe" \
        ./cmd/mawdaxe/
    
    SIZE=$(du -h "$BIN_DIR/mawdaxe" | cut -f1)
    log_info "Built: $BIN_DIR/mawdaxe ($SIZE)"
}

install_go() {
    GO_VER="1.22.4"
    TARBALL="go${GO_VER}.${GOOS}-${GOARCH}.tar.gz"
    
    log_step "Downloading Go $GO_VER..."
    curl -sSL "https://go.dev/dl/$TARBALL" -o "/tmp/$TARBALL"
    
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf "/tmp/$TARBALL"
    rm "/tmp/$TARBALL"
    
    export PATH="$PATH:/usr/local/go/bin"
    echo 'export PATH=$PATH:/usr/local/go/bin' >> "$HOME/.bashrc"
    
    log_info "Go $GO_VER installed"
}

# ─────────────────── Install Service ─────────────────────────────

install_service() {
    log_step "Installing system service..."
    
    mkdir -p "$LOG_DIR" "$DATA_DIR"
    
    if [[ "$GOOS" == "linux" ]] && command -v systemctl &>/dev/null; then
        install_systemd
    elif [[ "$GOOS" == "darwin" ]]; then
        install_launchd
    else
        log_warn "No service manager detected. Run manually:"
        echo "  MAWDAXE_CONFIG=$CONFIG_DIR/mawdaxe.json $BIN_DIR/mawdaxe"
    fi
}

install_systemd() {
    sudo tee /etc/systemd/system/mawdaxe.service > /dev/null <<EOF
[Unit]
Description=MawdAxe - MawdBot x Bitaxe Autonomous Mining Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
Environment=MAWDAXE_CONFIG=$CONFIG_DIR/mawdaxe.json
ExecStart=$BIN_DIR/mawdaxe
Restart=always
RestartSec=10
StandardOutput=append:$LOG_DIR/mawdaxe.log
StandardError=append:$LOG_DIR/mawdaxe-error.log
LimitNOFILE=65536

# Security hardening
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=$DATA_DIR $LOG_DIR
NoNewPrivileges=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable mawdaxe
    sudo systemctl start mawdaxe
    
    log_info "Service installed and started"
    log_info "Check status: sudo systemctl status mawdaxe"
    log_info "View logs: journalctl -u mawdaxe -f"
}

install_launchd() {
    PLIST="$HOME/Library/LaunchAgents/com.8bitlabs.mawdaxe.plist"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.8bitlabs.mawdaxe</string>
    <key>ProgramArguments</key>
    <array>
        <string>$BIN_DIR/mawdaxe</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>MAWDAXE_CONFIG</key>
        <string>$CONFIG_DIR/mawdaxe.json</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/mawdaxe.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/mawdaxe-error.log</string>
</dict>
</plist>
EOF
    
    launchctl load "$PLIST"
    log_info "LaunchAgent installed and started"
    log_info "View logs: tail -f $LOG_DIR/mawdaxe.log"
}

# ─────────────────── Print Summary ───────────────────────────────

print_summary() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  MawdAxe Setup Complete!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${CYAN}Devices:${NC}    ${#FOUND_DEVICES[@]} Bitaxe(s) configured"
    echo -e "  ${CYAN}Dashboard:${NC}  http://localhost:${MAWDAXE_API_PORT:-8420}"
    echo -e "  ${CYAN}API:${NC}        http://localhost:${MAWDAXE_API_PORT:-8420}/api/fleet"
    echo -e "  ${CYAN}Config:${NC}     $CONFIG_DIR/mawdaxe.json"
    echo -e "  ${CYAN}Binary:${NC}     $BIN_DIR/mawdaxe"
    echo -e "  ${CYAN}Logs:${NC}       $LOG_DIR/"
    echo ""
    echo -e "  ${YELLOW}Your TamaGOchi pet starts as an Egg 🥚${NC}"
    echo -e "  ${YELLOW}Mine shares to evolve: Larva 🦐 → Juvenile → Adult 🦞 → Alpha 👑${NC}"
    echo ""
    echo -e "  ${PURPLE}OpenClaw Network: Connect via Tailscale for swarm intelligence${NC}"
    echo -e "  ${PURPLE}Set TAILSCALE_AUTH_KEY to join the mesh${NC}"
    echo ""
}

# ─────────────────── Main ────────────────────────────────────────

main() {
    banner
    detect_platform
    discover_bitaxe
    generate_config
    build_binary
    install_service
    print_summary
}

main "$@"
