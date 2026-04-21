#!/usr/bin/env bash
# TavSin · Mainnet Deployment Script
#
# One-command mainnet deploy. Idempotent — safe to re-run.
#
# Pre-flight checklist:
#   1. Hardware wallet OR cold keypair available at $DEPLOY_KEYPAIR
#   2. Wallet funded with ~5 SOL on mainnet-beta
#   3. Program ID matches Anchor.toml [programs.mainnet] entry
#   4. anchor build has been run and target/deploy/tavsin.so exists
#   5. Squads multisig pubkey set in $UPGRADE_AUTHORITY (recommended)
#
# Usage:
#   DEPLOY_KEYPAIR=~/.config/solana/mainnet-deploy.json \
#   UPGRADE_AUTHORITY=<squads-multisig-pubkey> \
#   ./scripts/deploy-mainnet.sh

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log()   { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
die()   { echo -e "${RED}✗${NC} $1"; exit 1; }

# ── Pre-flight ────────────────────────────────────────────────────────────
log "TavSin mainnet deploy — pre-flight checks"

[ -n "${DEPLOY_KEYPAIR:-}" ] || die "DEPLOY_KEYPAIR not set. Export path to your deploy keypair."
[ -f "$DEPLOY_KEYPAIR" ] || die "Keypair file not found: $DEPLOY_KEYPAIR"
[ -f "target/deploy/tavsin.so" ] || die "Build artifact missing. Run 'anchor build' first."
[ -f "target/idl/tavsin.json" ] || die "IDL missing. Run 'anchor build' first."

DEPLOYER_PUBKEY=$(solana-keygen pubkey "$DEPLOY_KEYPAIR")
ok "Deployer: $DEPLOYER_PUBKEY"

# Confirm we're on mainnet-beta
RPC_URL=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [ -n "${MAINNET_RPC:-}" ]; then
  log "Setting RPC to custom MAINNET_RPC"
  solana config set --url "$MAINNET_RPC" >/dev/null
elif [[ "$RPC_URL" != *"mainnet"* ]]; then
  warn "Current RPC: $RPC_URL — not mainnet."
  read -p "Switch to public mainnet-beta? (rate-limited; Helius/Triton recommended) [y/N] " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || die "Aborted. Re-run with MAINNET_RPC=<your-rpc-url>."
  solana config set --url mainnet-beta >/dev/null
fi
FINAL_RPC=$(solana config get | grep 'RPC URL' | awk '{print $3}')
ok "RPC: $FINAL_RPC"

# Balance check (require 5 SOL — deploy ~3.8 + buffer for retries / IDL upload)
BALANCE=$(solana balance "$DEPLOYER_PUBKEY" | awk '{print $1}')
log "Deployer balance: $BALANCE SOL"
if (( $(echo "$BALANCE < 5.0" | bc -l) )); then
  die "Deployer needs at least 5 SOL for deploy + IDL upload. Top up first."
fi
ok "Balance sufficient"

# Program size + SHA (record this — verify on-chain hash matches post-deploy)
SIZE_BYTES=$(stat -f%z target/deploy/tavsin.so 2>/dev/null || stat -c%s target/deploy/tavsin.so)
SIZE_KB=$((SIZE_BYTES / 1024))
BINARY_SHA=$(shasum -a 256 target/deploy/tavsin.so | awk '{print $1}')
log "Program size: ${SIZE_KB} KB"
log "Binary SHA256: $BINARY_SHA"

# ── Final confirmation ───────────────────────────────────────────────────
echo
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  About to deploy TavSin to MAINNET-BETA${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Deployer:          $DEPLOYER_PUBKEY"
echo "  Upgrade authority: ${UPGRADE_AUTHORITY:-<deployer (NOT RECOMMENDED)>}"
echo "  RPC:               $FINAL_RPC"
echo "  Program size:      ${SIZE_KB} KB"
echo "  Binary SHA256:     $BINARY_SHA"
echo "  Estimated cost:    ~$(echo "scale=2; $SIZE_KB * 0.0007" | bc) SOL"
echo
read -p "Proceed with mainnet deploy? Type 'DEPLOY' to confirm: " -r CONFIRM
[ "$CONFIRM" = "DEPLOY" ] || die "Aborted."

# ── Deploy ────────────────────────────────────────────────────────────────
log "Deploying program (this can take several minutes)..."
anchor deploy --provider.cluster mainnet --provider.wallet "$DEPLOY_KEYPAIR"
ok "Program deployed"

PROGRAM_ID=$(solana address -k target/deploy/tavsin-keypair.json)
log "Program ID: $PROGRAM_ID"

# ── Transfer upgrade authority to multisig ───────────────────────────────
if [ -n "${UPGRADE_AUTHORITY:-}" ]; then
  log "Transferring upgrade authority to: $UPGRADE_AUTHORITY"
  solana program set-upgrade-authority "$PROGRAM_ID" \
    --new-upgrade-authority "$UPGRADE_AUTHORITY" \
    --keypair "$DEPLOY_KEYPAIR"
  ok "Upgrade authority transferred. Future upgrades require multisig approval."
else
  warn "No UPGRADE_AUTHORITY set. Deployer remains the upgrade authority."
  warn "STRONGLY RECOMMENDED: transfer to a Squads multisig before announcing mainnet."
fi

# ── Upload IDL ───────────────────────────────────────────────────────────
log "Uploading IDL to chain..."
if anchor idl init --provider.cluster mainnet --provider.wallet "$DEPLOY_KEYPAIR" \
  --filepath target/idl/tavsin.json "$PROGRAM_ID" 2>/dev/null; then
  ok "IDL initialized"
else
  warn "idl init failed (already exists?). Trying upgrade..."
  anchor idl upgrade --provider.cluster mainnet --provider.wallet "$DEPLOY_KEYPAIR" \
    --filepath target/idl/tavsin.json "$PROGRAM_ID" || warn "IDL upgrade failed — upload manually later."
fi

# ── Verify ────────────────────────────────────────────────────────────────
log "Verifying deployment..."
solana program show "$PROGRAM_ID" --url "$FINAL_RPC"

# ── Output ────────────────────────────────────────────────────────────────
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ TavSin is LIVE on mainnet-beta${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Program ID: $PROGRAM_ID"
echo "  Explorer:   https://explorer.solana.com/address/$PROGRAM_ID"
echo
echo "Next steps:"
echo "  1. Update Anchor.toml [programs.mainnet] = \"$PROGRAM_ID\""
echo "  2. Update app/src/lib/program-config.ts MAINNET_PROGRAM_ID"
echo "  3. Update README.md & docs/ with mainnet program ID"
echo "  4. Announce on Twitter/Discord"
echo "  5. Smoke-test: create one wallet on mainnet, run one tx"
echo
