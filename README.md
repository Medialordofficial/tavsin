<div align="center">

# 🛡️ Aegis

### The On-Chain Spending Policy Engine for AI Agents

**Every AI agent that touches money will need Aegis.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built on Solana](https://img.shields.io/badge/Built%20on-Solana-9945FF)]()
[![Frontier Hackathon](https://img.shields.io/badge/Colosseum-Frontier%202026-orange)]()

</div>

---

## The Problem — in 30 seconds

AI agents can now browse the web, write code, and call APIs autonomously. The next step is obvious: **agents that move money on-chain.**

But right now, giving an AI agent a wallet is binary:
- **Lock it down** → the agent can't do anything useful
- **Give it access** → one bad transaction drains the wallet

MCPay and Latinum solved *how* agents pay. Nobody has solved **who controls the spending.**

There is no spending policy engine. No per-agent limits. No anomaly detection. No on-chain enforcement of budget rules. Developers hardcode limits in application code and hope for the best.

**This is the gap. Aegis fills it.**

---

## What Aegis Is

Aegis is an **on-chain spending policy engine** for autonomous AI agents on Solana.

It's the programmable layer between an agent's wallet and the blockchain that enforces spending rules — per-agent budgets, per-vendor limits, time-bounded allowances, contract allowlists, and anomaly detection — **enforced by a Solana program, not application code.**

Think of it as **Brex corporate card controls, but for AI agent wallets, enforced on-chain.**

```
Agent wants to spend → Aegis checks policy on-chain → ✅ Execute | ⚠️ Escalate | ❌ Block
```

---

## Why This Wins

| What exists today | What's missing (Aegis) |
|---|---|
| x402 — agents can pay per-request | No one controls *how much* they pay |
| MCP — thousands of tool servers | No spending governance across tools |
| MCPay / Latinum — payment rails | Budget management delegated to devs |
| Turnkey — agent wallet creation | No transaction-level policy enforcement |
| Blowfish — passive risk warnings | Active enforcement, not warnings |
| Squads — human multisig approval | Automated policy for autonomous agents |

**Aegis is the missing layer in the stack.**

---

## How It Works

### 1. Create a Policy (on-chain)

```typescript
const policy = await aegis.createPolicy({
  agent: agentPublicKey,
  rules: {
    maxPerTransaction: 50_000_000,  // 50 USDC (6 decimals)
    maxDaily:         500_000_000,  // 500 USDC/day
    allowedPrograms:  [JUPITER_V6, RAYDIUM_AMM],
    blockedTokens:    [KNOWN_SCAM_MINT],
    requireApproval:  { above: 200_000_000 },  // Human confirm > 200 USDC
    timeWindow:       { activeHours: [9, 17] }, // 9am-5pm UTC only
  }
});
```

Policies are stored **on-chain** as Solana accounts. The agent cannot modify its own policy — only the policy owner (user) can.

### 2. Agent Proposes a Transaction

The agent builds a transaction using any framework (LangChain, AutoGPT, custom) and submits it through the Aegis SDK:

```typescript
const result = await aegis.execute({
  agent: agentKeypair,
  transaction: swapInstruction,  // e.g. Jupiter swap
});
// Returns: { status: 'approved' | 'escalated' | 'blocked', txSignature?, reason? }
```

### 3. Aegis Evaluates On-Chain

The Solana program checks:
- Does this transaction exceed the per-tx spend limit?
- Would this push the agent over its daily/weekly budget?
- Is the target program on the allowlist?
- Is the token mint flagged?
- Does the amount trigger human escalation?
- Is this within the allowed time window?

### 4. Enforce the Decision

| Check Result | Action |
|---|---|
| All rules pass | Transaction executes on-chain |
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
│  │            Aegis TypeScript SDK                 │  │
│  │   aegis.execute()  aegis.createPolicy()        │  │
│  └──────────────────────┬─────────────────────────┘  │
└─────────────────────────┼────────────────────────────┘
                          │ CPI
┌─────────────────────────▼────────────────────────────┐
│              AEGIS SOLANA PROGRAM (Anchor)            │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Policy    │  │ Spend    │  │ Decision         │   │
│  │ Store     │  │ Tracker  │  │ Engine           │   │
│  │ (PDA)     │  │ (PDA)    │  │ (evaluate_tx)    │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │            Audit Log (PDA per decision)       │   │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│                   SOLANA BLOCKCHAIN                   │
│       Token transfers · DeFi swaps · Any ix          │
└──────────────────────────────────────────────────────┘
```

**Key design decision:** Policy enforcement happens inside a Solana program via CPI (Cross-Program Invocation), not in off-chain middleware. The agent *cannot* bypass the policy — it's at the protocol level.

---

## Concrete Use Cases

### 1. DeFi Agent with Spending Controls
A yield-farming agent autonomously harvests rewards and rebalances — but capped at 500 USDC/day, restricted to Jupiter and Raydium only.

### 2. MCP Tool Payments
An AI agent paying for MCP tool calls via x402 — Aegis enforces per-vendor caps so a malfunctioning agent can't drain the wallet on a single API.

### 3. Agent Fleet Management
A company running 50 AI agents — each with individual budgets, shared audit logs, and anomaly detection. The operator dashboard shows spend per agent in real-time.

### 4. Delegated Trading
User delegates trading to an AI agent — Aegis ensures it can only trade approved token pairs, with max position sizes, and auto-blocks if portfolio drops below a threshold.

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
| **On-chain program** | Anchor (Rust) on Solana |
| **Policy storage** | PDAs (Program Derived Addresses) |
| **Spend tracking** | On-chain rolling windows per agent |
| **Agent SDK** | TypeScript (`@aegis/sdk`) |
| **Dashboard** | Next.js + Helius RPC |
| **Testing** | Bankrun (Solana local test) |
| **AI Integration** | Compatible with any agent framework |

---

## What We're Building (Hackathon Scope)

**Week 1-2:** Anchor program — policy creation, spend tracking, transaction evaluation via CPI
**Week 3:** TypeScript SDK + demo AI agent that proposes transactions through Aegis
**Week 4:** Minimal dashboard showing policies, spend tracking, and audit log
**Week 5:** Polish, real demo on devnet, pitch video

**MVP deliverable:** An AI agent that autonomously executes Solana transactions — where every tx is checked against on-chain spending policies, and violations are blocked at the protocol level.

---

## Differentiation

| Project | What they do | How Aegis is different |
|---|---|---|
| **MCPay** | x402 payments for MCP tools | No spending governance; Aegis adds policy layer on top |
| **Latinum** | Agent payment middleware | Budget management in app code; Aegis enforces on-chain |
| **Blowfish** | Scam detection for wallets | Passive warnings to humans; Aegis actively blocks for agents |
| **Turnkey** | Wallet infra for agents | Key management, not transaction policy enforcement |
| **Squads** | Multisig | Human consensus model; Aegis is automated policy for agents |
| **Agent-Cred** | Hotkey/coldkey architecture | Key separation; no spending rules or anomaly detection |

---

## Getting Started

```bash
git clone https://github.com/Medialordofficial/aegis.git
cd aegis

# Install dependencies
yarn install

# Build the Solana program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

## License

MIT — see [LICENSE](LICENSE)
