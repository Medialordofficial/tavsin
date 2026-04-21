<div align="center">

# 🛡️ Tavsin

### The Compliance Layer for AI Agents on Solana

**Policy-enforced smart wallets — your agent operates autonomously, your compliance officer sleeps at night.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF)]()
[![Readiness](https://img.shields.io/badge/Readiness-Devnet%20Live-22c55e)]()
[![Tests](https://img.shields.io/badge/Tests-28%20passing-22c55e)]()
[![Audit](https://img.shields.io/badge/Audit-C%2FH%20findings%20fixed-22c55e)](docs/AUDIT_BRIEF.md)
[![Dashboard](https://img.shields.io/badge/Dashboard-tavsin.xyz-cyan)](https://tavsin.xyz/dashboard)
[![MCP](https://img.shields.io/badge/MCP-Compatible-ff6b35)](mcp/README.md)

</div>

> **Program ID:** [`2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy`](https://explorer.solana.com/address/2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy?cluster=devnet) (devnet)
> **Live App:** [tavsin.xyz](https://tavsin.xyz) · **Live Deny Feed:** [tavsin.xyz/live](https://tavsin.xyz/live) · **Health:** [tavsin.xyz/api/health](https://tavsin.xyz/api/health)

---

## 🏆 For Hackathon Judges — Try It in 60 seconds

```bash
git clone https://github.com/Medialordofficial/tavsin && cd tavsin

# Run the live USDC demo on devnet (no setup, mints its own demo token)
cd examples/demo-agent && npm install && npm run demo:usdc

# Or — watch a prompt-injection attack get denied 4 ways on-chain
npm run demo:jailbreak

# OR plug TavSin into Claude Desktop as MCP tools — see mcp/README.md
cd mcp && npm install && npm run build
```

**What you'll see:** an autonomous agent making USDC payments → policy approves small ones, denies oversized ones, hits the daily budget cap, and emits a full on-chain audit trail. Every decision queryable on Solana Explorer.

The **jailbreak demo** simulates 4 distinct attacks (direct drain, salami slice, social-engineering privilege escalation, allowlist bypass via Jupiter reroute). All 4 are denied at the program boundary. **The LLM gets fooled. The wallet does not.**

| Where to look | What you'll find |
|---|---|
| [`programs/tavsin/`](programs/tavsin/) | Anchor program (Rust) — 17 instructions, 7 account types, 14 events |
| [`app/src/app/live/page.tsx`](app/src/app/live/page.tsx) | **Live deny feed** — subscribes to program logs, decodes `RequestDenied` events in real time. No backend |
| [`mcp/`](mcp/) | MCP server — Claude/Cursor can call TavSin natively (7 tools) |
| [`examples/demo-agent/`](examples/demo-agent/) | Live demo agents (SOL & USDC variants + jailbreak) |
| [`examples/squads-owner/`](examples/squads-owner/) | **Squads multisig as owner** — vault PDA controls the smart wallet |
| [`sdk/`](sdk/) | TypeScript SDK (`@tavsin/sdk`) — framework-agnostic AI tools (Vercel/Anthropic/OpenAI/MCP/SAK) |
| [`tests/`](tests/) | 28 passing tests — policy, requests, SPL, security regressions, owner controls |
| [`docs/AUDIT_BRIEF.md`](docs/AUDIT_BRIEF.md) | Audit summary: 4 critical + 6 high findings, all fixed |

---

## The Problem — in 30 seconds

AI agents can now browse the web, write code, and call APIs autonomously. The next step is obvious: **agents that move money on-chain.**

But right now, giving an AI agent a wallet is binary:
- **Lock it down** → the agent can't do anything useful
- **Give it access** → one bad transaction drains the wallet

MCPay and Latinum solved *how* agents pay. Nobody has solved **who controls the spending.**

There is no smart wallet for agents. No per-agent limits. No anomaly detection. No on-chain enforcement of budget rules. Developers hardcode limits in application code and hope for the best.

**This is the regulatory blocker keeping enterprises from deploying agents at scale. Tavsin fills it.**

---

## What Tavsin Is

Tavsin is a **policy-enforced smart wallet for autonomous AI agents on Solana.**

It's not a middleware that sits in front of another wallet. **Tavsin IS the wallet.** Agent funds live inside a Tavsin smart wallet (a PDA owned by the Tavsin program). To spend, the agent calls the Tavsin program, which evaluates every rule on-chain — per-agent budgets, counterparty limits, time-bounded allowances, program allowlists, blocked mints, and approval thresholds — and only then signs the transaction with the PDA's authority.

The agent never has raw key access. It cannot bypass the policy. This is architecturally identical to how **Squads multisig wallets** work — but for autonomous agents instead of human committees.

Think of it as **Brex corporate card controls, but the card itself is a smart wallet on Solana.**

```
Agent requests spend → Tavsin evaluates policy on-chain → ✅ Sign & Execute | ⚠️ Escalate | ❌ Block
```

---

## Why This Wins

| What exists today | What's missing (Tavsin) |
|---|---|
| x402 — agents can pay per-request | No one controls *how much* they pay |
| MCP — thousands of tool servers | No spending governance across tools |
| MCPay / Latinum — payment rails | Budget management delegated to devs |
| Turnkey — agent wallet creation | No transaction-level policy enforcement |
| Blowfish — passive risk warnings | Active enforcement, not warnings |
| Squads — human multisig approval | Automated policy for autonomous agents |

**Tavsin is the missing layer in the stack.**

---

## How It Works

### 1. Create a Smart Wallet with Policy (on-chain)

```typescript
const wallet = await tavsin.createWallet({
  agent: agentPublicKey,
  policy: {
    maxPerTransaction: 50_000_000,  // 50 USDC (6 decimals)
    maxDaily:         500_000_000,  // 500 USDC/day
    allowedPrograms:  [JUPITER_V6, RAYDIUM_AMM],
    blockedTokens:    [KNOWN_SCAM_MINT],
    requireApproval:  { above: 200_000_000 },  // Human confirm > 200 USDC
    timeWindow:       { activeHours: [9, 17] }, // 9am-5pm UTC only
  }
});
// wallet.address → PDA owned by Tavsin program
// Fund this PDA — it IS the agent's wallet
```

The wallet PDA is owned by the Tavsin program. The agent cannot modify its own policy — only the wallet owner (user/operator) can. Funds live inside the PDA.

### 2. Agent Requests a Transaction

The agent builds a transaction using any framework (LangChain, AutoGPT, custom) and submits it through the Tavsin SDK:

```typescript
const result = await tavsin.execute({
  agent: agentKeypair,
  instruction: swapInstruction,  // e.g. Jupiter swap
});
// Returns: { status: 'approved' | 'escalated' | 'blocked', txSignature?, reason? }
```

### 3. Tavsin Evaluates On-Chain

The Solana program checks:
- Does this transaction exceed the per-tx spend limit?
- Would this push the agent over its daily/weekly budget?
- Is the target program on the allowlist?
- Is the token mint flagged?
- Does the amount trigger human escalation?
- Is this within the allowed time window?

### 4. Sign or Block

| Check Result | Action |
|---|---|
| All rules pass | Tavsin signs with PDA authority → tx executes |
| Escalation threshold hit | Tx held; notification sent to owner |
| Any rule violated | Transaction rejected; logged to audit trail |

Every decision — approve, escalate, reject — is recorded on-chain in an immutable audit log.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AGENT LAYER                        │
│  Any AI agent framework: LangChain, AutoGPT,        │
│  MCP tools, custom bots                              │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │           Tavsin TypeScript SDK                 │  │
│  │   tavsin.execute()  tavsin.createWallet()       │  │
│  └──────────────────────┬─────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│             TAVSIN SOLANA PROGRAM (Anchor)            │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Smart     │  │ Spend    │  │ Policy           │   │
│  │ Wallet    │  │ Tracker  │  │ Engine           │   │
│  │ (PDA)     │  │ (PDA)    │  │ (evaluate_tx)    │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │            Audit Log (PDA per decision)       │   │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  Signs with PDA authority → executes on target       │
└──────────────────────────┬───────────────────────────┘
                           │ CPI (Tavsin → Jupiter, etc.)
┌──────────────────────────▼───────────────────────────┐
│                   SOLANA BLOCKCHAIN                   │
│       Token transfers · DeFi swaps · Any ix          │
└──────────────────────────────────────────────────────┘
```

**Key design decision:** The agent's funds live inside a Tavsin smart wallet PDA. To spend, the agent calls the Tavsin program → Tavsin checks policy → if approved, Tavsin signs with the PDA's authority and CPI-invokes the target program (Jupiter, Raydium, etc.). The agent never holds keys to bypass this.

---

## Concrete Use Cases

### 1. DeFi Agent with Spending Controls
A yield-farming agent autonomously harvests rewards and rebalances — but capped at 500 USDC/day, restricted to Jupiter and Raydium only.

### 2. MCP Tool Payments via x402
An AI agent paying for MCP tool calls via x402 — Tavsin enforces per-vendor caps so a malfunctioning agent can't drain the wallet on a single API.

### 3. Agent Fleet Management
A company running 50 AI agents — each with individual TavSin wallets, individual budgets, shared audit logs, and owner approval queues. The operator dashboard shows spend controls and review state per agent wallet.

### 4. Delegated Trading
User delegates trading to an AI agent — TavSin ensures it can only touch approved programs, recipients, and mints, with capped transaction sizes and approval escalation above threshold.

### 5. Agent-to-Agent Commerce
Agent A can pay Agent B up to X USDC for services — creating a mesh of governed spending relationships. Tavsin enforces cross-agent budgets.

---

## Revenue Model

| Revenue Stream | Description |
|---|---|
| **Protocol fee** | 0.05-0.1% on policy-checked transactions |
| **SDK SaaS** | Monthly fee for managed dashboard + analytics |
| **Enterprise** | Custom policy templates for agent fleet operators |

**TAM:** Every AI agent that moves value on Solana is a potential customer. The "Solana AI Agent Infrastructure" cluster already has 325+ projects — all of which need spending controls.

---

## Tech Stack

| Component | Technology |
|---|---|
| **Smart wallet program** | Anchor (Rust) on Solana |
| **Wallet + policy storage** | PDAs (Program Derived Addresses) |
| **Spend tracking** | On-chain rolling windows per agent |
| **Agent SDK** | TypeScript (`@tavsin/sdk`) |
| **Dashboard** | Next.js App Router + server read API + managed RPC |
| **Landing page** | Next.js on Vercel |
| **Testing** | Anchor test + legacy validator |
| **AI Integration** | Compatible with any agent framework |

---

## Current Scope

The current repository is focused on three surfaces:

- on-chain governed smart-wallet execution and policy enforcement
- a TypeScript SDK for client integrations
- an operator console for approvals, policy editing, and audit visibility

The product is ready for serious devnet testing and controlled canary preparation, but it still requires external security review and finalized mainnet operations before broad public launch.

---

## Differentiation

| Project | What they do | How Tavsin is different |
|---|---|---|
| **MCPay** | x402 payments for MCP tools | No spending governance; Tavsin adds policy-enforced wallet |
| **Latinum** | Agent payment middleware | Budget management in app code; Tavsin enforces on-chain |
| **Blowfish** | Scam detection for wallets | Passive warnings to humans; Tavsin actively blocks for agents |
| **Turnkey** | Wallet infra for agents | Key management, not transaction policy enforcement |
| **Squads** | Multisig | Human consensus model; Tavsin is automated policy for agents |
| **Agent-Cred** | Hotkey/coldkey architecture | Key separation; no spending rules or anomaly detection |

---

## Getting Started

```bash
git clone https://github.com/Medialordofficial/tavsin.git
cd tavsin

# Install dependencies
yarn install

# Build the Solana program
anchor build

# Run tests
npm run test:anchor:skip-build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

## Demo Scripts

Run these on devnet to see TavSin in action (requires `tsx` — installed as a devDep):

| Script | What it does |
|---|---|
| `npx tsx scripts/agent-bot.ts` | End-to-end: create wallet → fund → submit request → execute → audit trail |
| `npx tsx scripts/kill-switch.ts` | Freeze/unfreeze demo: 9 steps showing owner freeze blocks agent, unfreeze re-enables |
| `npx tsx scripts/jupiter-swap.ts` | Governed Jupiter swap through TavSin policy engine |
| `npx tsx scripts/x402-mcp-demo.ts` | x402 MCP tool payments: agent pays for 6 tool calls, policy blocks overspend |

Each script generates a fresh agent keypair — no setup needed beyond a funded devnet wallet.

## Environment Configuration

Copy [.env.example](.env.example) and set the cluster / RPC pair for both the public app and the server-side read API. The dashboard now routes wallet discovery and pending approval reads through Next.js API handlers, so the client and server RPCs can be separated.

Use [.env.devnet.example](.env.devnet.example) and [.env.mainnet.example](.env.mainnet.example) as environment presets. Both include RPC and deploy-time program ID settings.

## SDK Example

See [examples/sdk-client/README.md](examples/sdk-client/README.md) for a minimal external-consumer example that creates a wallet, submits a request, and fetches audit history with the SDK.

Typecheck it from repo root with:

```bash
npm run typecheck:sample-sdk
```

Operational guidance lives in [docs/MAINNET_LAUNCH_RUNBOOK.md](docs/MAINNET_LAUNCH_RUNBOOK.md), review prep lives in [docs/SECURITY_REVIEW_PREP.md](docs/SECURITY_REVIEW_PREP.md), and gate-by-gate readiness is tracked in [docs/PRELAUNCH_CHECKLIST.md](docs/PRELAUNCH_CHECKLIST.md).

---

## License

MIT — see [LICENSE](LICENSE)
