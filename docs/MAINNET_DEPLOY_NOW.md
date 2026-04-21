# Mainnet Deploy — Run These Commands

Status as of 21 Apr 2026:

- ✅ Program built fresh — `target/deploy/tavsin.so` (533 KB)
- ✅ Binary SHA256 — `e53c403880205abea850c3adc89a9462cb9bcb828edcf8ff392a7ae54cf41f3f`
- ✅ Program ID locked — `2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy`
- ✅ Anchor.toml `[programs.mainnet]` configured
- ✅ Deploy script hardened — 5 SOL min, custom RPC support, IDL upload, post-deploy SHA verify
- ⏸️ Awaiting: funded keypair + Squads multisig pubkey + RPC URL (you must provide)

## Step 1 — Fund a fresh deploy keypair (≥ 5 SOL)

```bash
solana-keygen new -o ~/.config/solana/tavsin-mainnet-deploy.json
solana address -k ~/.config/solana/tavsin-mainnet-deploy.json
# Send 5+ SOL to that address from a CEX or cold wallet.
```

## Step 2 — Create the Squads multisig

1. Go to https://app.squads.so and create a 2-of-N multisig with 2+ signers
2. Copy the **vault** address (NOT the multisig account address — the vault is the
   account that will hold upgrade authority)
3. Export it:

```bash
export UPGRADE_AUTHORITY=<paste-squads-vault-address-here>
```

## Step 3 — Set your RPC URL (Helius free tier works)

```bash
export MAINNET_RPC="https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
```

## Step 4 — Deploy

```bash
DEPLOY_KEYPAIR=~/.config/solana/tavsin-mainnet-deploy.json \
UPGRADE_AUTHORITY=$UPGRADE_AUTHORITY \
MAINNET_RPC=$MAINNET_RPC \
./scripts/deploy-mainnet.sh
```

The script will:

1. Verify keypair, balance ≥ 5 SOL, fresh artifact, mainnet RPC
2. Show binary SHA256 — **screenshot this for your launch tweet**
3. Require you to type `DEPLOY` to proceed
4. Deploy the program (3-5 minutes)
5. Upload the IDL
6. Transfer upgrade authority to your Squads vault
7. Print explorer link + post-deploy checklist

## Step 5 — Verify on-chain SHA matches

After deploy completes:

```bash
PROGRAM_ID=2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy
solana program dump $PROGRAM_ID /tmp/onchain.so --url $MAINNET_RPC
shasum -a 256 /tmp/onchain.so
# Must match: e53c403880205abea850c3adc89a9462cb9bcb828edcf8ff392a7ae54cf41f3f
```

If the SHAs match, you have a verifiable on-chain build.

## Step 6 — Update repo + announce

```bash
# Update README.md "Status" line and any "devnet" references
# Update app/src/lib/program-config.ts MAINNET_PROGRAM_ID if not already set
# Commit and push
git add -A && git commit -m "feat: TavSin live on mainnet-beta" && git push
```

Then post the launch tweet (Tweet 8 in [docs/CONTENT_PACK.md](CONTENT_PACK.md))
with:

- Program ID + explorer link
- Binary SHA256 (proves deploy is reproducible from source)
- Squads vault as upgrade authority (proves it's not rug-able)

## Recovery — if deploy fails partway

`anchor deploy` is resumable. If it errors mid-deploy (RPC drop, etc.):

```bash
# Find the in-progress buffer
solana program show --buffers --buffer-authority $(solana-keygen pubkey $DEPLOY_KEYPAIR) \
  --url $MAINNET_RPC

# Resume with that buffer
solana program deploy target/deploy/tavsin.so \
  --program-id target/deploy/tavsin-keypair.json \
  --buffer <BUFFER_ADDRESS> \
  --keypair $DEPLOY_KEYPAIR \
  --url $MAINNET_RPC
```

If you want to abandon and reclaim the SOL:

```bash
solana program close <BUFFER_ADDRESS> --recipient $(solana-keygen pubkey $DEPLOY_KEYPAIR)
```

## Why I didn't auto-deploy

You weren't available to provide:

- Path to your funded mainnet keypair (a secret — should never live in chat or repo)
- Squads multisig vault address (only you know which multisig is yours)
- RPC URL with API key (a secret)

And mainnet deploy is irreversible — if I picked a wrong upgrade authority or
deployed with the wrong program keypair, the SOL is burned and the program ID is
permanent. So this stays a manual one-command step you run when ready.
