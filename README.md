<div align="center">

# 🛡️ Tavsin

### The Smart Wallet for AI Agents on Solana

**Your agent doesn't need a wallet. It needs a Tavsin account.**

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

There is no smart wallet for agents. No per-agent limits. No anomaly detection. No on-chain enforcement of budget rules. Developers hardcode limits in application code and hope for the best.

**This is the gap. Tavsin fills it.**

---

## What Tavsin Is

Tavsin is a **policy-enforced smart wallet for autonomous AI agents on Solana.**

It's not a middleware that sits in front of another wallet. **Tavsin IS the wallet.** Agent funds live inside a Tavsin smart wallet (a PDA owned by the Tavsin program). To spend, the agent calls the Tavsin program, which evaluates every rule on-chain — per-agent budgets, per-vendor limits, time-bounded allowances, program allowlists, anomaly detection — and only then signs the transaction with the PDA's authority.

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
A company running 50 AI agents — each with individual Tavsin wallets, individual budgets, shared audit logs, and anomaly detection. The operator dashboard shows spend per agent in real-time.

### 4. Delegated Trading
User delegates trading to an AI agent — Tavsin ensures it can only trade approved token pairs, with max position sizes, and auto-blocks if portfolio drops below a threshold.

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
| **Dashboard** | Next.js + Helius RPC |
| **Landing page** | Next.js on Vercel |
| **Testing** | Bankrun (Solana local test) |
| **AI Integration** | Compatible with any agent framework |

---

## What We're Building (Hackathon Scope)

**Week 1-2:** Anchor program — smart wallet creation, policy enforcement, spend tracking, CPI execution
**Week 3:** TypeScript SDK + demo AI agent that transacts through Tavsin wallets
**Week 4:** Dashboard (fleet management, audit viewer) + landing page
**Week 5:** Polish, real demo on devnet, pitch video

**MVP deliverable:** An AI agent that autonomously executes Solana transactions through a Tavsin smart wallet — where every tx is checked against on-chain spending policies, and violations are blocked at the wallet level.

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
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

## License

MIT — see [LICENSE](LICENSE)
