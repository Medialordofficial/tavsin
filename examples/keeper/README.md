# TavSin Keeper Bot

A minimal, production-shaped keeper that watches for `RequestApproved` events
and immediately calls `execute_request` on-chain. Approvals don't execute
themselves — every TavSin deployment needs (1) the program, (2) a frontend or
agent that submits requests, and (3) a keeper that lands them on-chain after
approval.

## Why a keeper?

TavSin's separation of *approve* and *execute* is intentional:

- **Approve** is a policy decision (who/what/when).
- **Execute** is a transaction-landing concern (gas, blockhash, retries).

Decoupling them means the approver (a human, a multisig, a Telegram bot) does
not need to hold SOL or run infrastructure. A small keeper fleet handles all
landings, and any third party can run one — they cannot censor (the request
is already approved on-chain) and they cannot front-run (the payload hash is
sealed at submit time).

## Run

```bash
cd examples/keeper
npm install
KEEPER_KEYPAIR=~/.config/solana/id.json \
RPC_URL=https://api.devnet.solana.com \
npm run start
```

The bot:
1. Subscribes to TavSin program logs via WebSocket.
2. Parses `RequestApproved` events using the on-chain IDL.
3. Loads the request account, rebuilds the execute-ix accounts.
4. Submits `execute_request` and logs the resulting signature.
5. Tracks failures and backs off exponentially per request.

## Production hardening checklist

- [ ] Run two keepers in different regions for redundancy.
- [ ] Use a paid RPC (Helius, Triton, QuickNode) — public RPC will rate-limit.
- [ ] Set `commitment: "processed"` for the subscription, `confirmed` for
      execute confirmation.
- [ ] Add Prometheus metrics on `requests_executed_total`,
      `execute_latency_seconds`, `execute_failures_total{reason=...}`.
- [ ] Alarm if a request stays in `Approved` state > 60s without an attempt.
- [ ] Fund keepers from a separate hot wallet, not the agent or owner.
- [ ] Periodically rotate the keeper keypair.
