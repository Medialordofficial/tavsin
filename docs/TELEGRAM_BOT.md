# TavSin Telegram Kill-Switch Bot

Freeze or unfreeze any TavSin smart wallet from Telegram in one command.

## Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Set Environment Variables

Add these to your `.env.local` (or Vercel environment):

```bash
# Bot token from @BotFather
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# Owner keypair (JSON array of secret key bytes)
# Export with: solana-keygen pubkey --outfile /dev/null && cat ~/.config/solana/id.json
TAVSIN_OWNER_KEYPAIR=[1,2,3,...,64]

# Restrict to your Telegram chat ID (get it from @userinfobot)
TELEGRAM_ALLOWED_CHAT_IDS=123456789
```

### 3. Register the Webhook

After deploying, register your webhook URL with Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tavsin.xyz/api/telegram/webhook"}'
```

## Commands

| Command | Description |
|---|---|
| `/freeze <wallet_pda>` | Freeze a wallet — blocks all agent transactions |
| `/unfreeze <wallet_pda>` | Unfreeze a wallet — re-enables agent transactions |
| `/status <wallet_pda>` | Check wallet status, balance, and agent info |
| `/help` | Show available commands |

## Security

- **Chat ID restriction**: Only Telegram users whose chat IDs are in `TELEGRAM_ALLOWED_CHAT_IDS` can use the bot.
- **Owner keypair**: The bot signs freeze/unfreeze transactions with the owner keypair — only the wallet owner can freeze their own wallets.
- **Serverless**: Runs as a Vercel serverless function — no persistent server to maintain.

## Demo Flow

1. Create a wallet on the dashboard
2. Send `/status <wallet_pda>` to the bot — see "Active"
3. Send `/freeze <wallet_pda>` — wallet is now frozen
4. Agent tries to transact — blocked with "Wallet frozen"
5. Send `/unfreeze <wallet_pda>` — agent can transact again
