# TavSin · Pitch v2 (Colosseum Frontier 2026)

> Sharper. Compliance-led. Defends against the "Squads question." Built for judges in 2 minutes.

---

## THE 2-MINUTE PITCH

### [HOOK — 10 sec]

> "In 18 months, every business will deploy AI agents that move money. None of them will be allowed to without spending controls. Today, those controls don't exist on Solana — that's what we built."

### [THE PROBLEM — 25 sec]

AI agents already pay for things on Solana. x402 standardized agent payments. MCPay and Latinum built the rails. Agents are buying API credits, paying for compute, swapping tokens — autonomously, right now.

But every existing agent wallet is one of two things: **fully locked** (useless) or **fully open** (lawsuit waiting to happen). No fleet visibility. No on-chain enforcement. No audit trail. If you're a fintech deploying 50 agents, you have no way to prove to your compliance officer — or your regulator — that those agents can't drain your treasury.

This isn't a feature gap. This is the **regulatory blocker** to enterprise AI agent adoption.

### [TAVSIN — 25 sec]

TavSin is the **compliance layer for AI agents on Solana.** A policy-enforced smart wallet where spending rules live on-chain.

You set the rules — per-tx limits, daily budgets, approved vendors, blocked tokens, time windows, escalation thresholds. The agent never holds keys. When it wants to spend, the TavSin program evaluates every rule. Approved → it signs with the wallet's PDA authority and executes. Violated → rejected and logged immutably.

Squads does this for human multisigs. **TavSin does it for autonomous agents.** Different threat model, different primitives — agent identity, reputation graphs, MCP-native tooling, anomaly detection.

### [LIVE DEMO — 35 sec]

*[Screen: split view — Claude Desktop on left, devnet explorer on right]*

Watch this. I'm asking Claude to spend USDC from a TavSin wallet. The wallet has 50 USDC per-tx and 200 USDC daily caps.

> *"Claude, pay merchant XYZ 25 USDC for API credits."*

Claude calls TavSin's MCP tool. Policy passes. Transfer executes. ✅ Logged.

> *"Pay another 30 USDC."*

Passes. ✅ Logged.

> *"Now pay 75 USDC."*

❌ Denied. Exceeds per-tx limit. The TavSin program literally refused to sign. Logged with reason.

> *"Pay 40 USDC five times."*

After three: ❌ Denied. Daily budget hit. Logged.

Every decision is on-chain. Every reason is queryable. This is what a compliance officer needs to see.

### [THE MOAT — 15 sec]

Yes, anyone could fork this. They couldn't fork the network effect we're building:

1. **Shared blocklist registry** — when one wallet flags a malicious recipient, every TavSin wallet benefits
2. **Agent reputation graph** — on-chain spending history becomes credit score
3. **MCP-native** — already plugged into Claude, Cursor, every MCP client
4. **Compliance-grade audit** — purpose-built for regulators, not retrofitted

Squads optimizes for human treasuries. TavSin optimizes for autonomous agents. **Different game.**

### [BUSINESS — 10 sec]

Revenue: 5–10 bps on policy-checked transactions + SaaS for fleet operators. Every enterprise agent that touches money on Solana is a potential customer. SDK is open source. Adoption is de-risking — devs ship to TavSin because their lawyers told them to.

### [CLOSE — 5 sec]

> "Agents are going to move trillions on-chain. TavSin is the only reason your compliance team will let them."

---

## THE "SQUADS QUESTION" — Defensive Brief

> Garrett Harper from Squads Labs is a judge. Squads could clone TavSin in a sprint. Have an answer ready.

**The answer is not "we're better than Squads."** Squads is excellent. Don't fight on their turf.

**The answer is: we solve a different problem.**

| | Squads | TavSin |
|---|---|---|
| Authorization model | M-of-N human signers | Policy engine + agent identity |
| Latency | Async approval (humans) | Sync (sub-second autonomous) |
| Audit primitive | Transaction history | Per-agent denial reasons + reputation |
| Identity model | Wallet addresses | Agent identity + MCP discovery |
| Threat model | Insider collusion, key compromise | Prompt injection, model jailbreak, runaway loops |
| User | CFO of a DAO | Engineering team deploying agents |

The technical primitives **look** similar. The threat models are completely different. Squads protects against bad humans. TavSin protects against bad inference.

If a Squads judge asks: **"Squads is the trust layer for human treasuries. We're the compliance layer for the agent economy. Your customers will use both."**

---

## THE MOAT — In Detail

### 1. Shared Blocklist Registry (Network Effect)
When any TavSin wallet flags a recipient as malicious (rug, drainer, sanctioned), it propagates to a shared on-chain registry. New wallets opt in by default. **Every additional user makes the system safer for everyone.** Forking the code doesn't fork the registry.

### 2. Agent Reputation Graph (Data Moat)
Every TavSin wallet writes immutable per-agent records: approval rate, denial reasons, spending velocity, recipient diversity. Over time, this becomes the **credit score for autonomous agents.** Lenders, payment networks, and compliance tools will query it. Forking gives you the code; not the history.

### 3. MCP-Native Distribution (Channel Moat)
TavSin ships as an MCP server — the standard tool protocol for AI agents. Every Claude/Cursor/Continue user who installs it becomes a distribution node. Squads is wallet-native; TavSin is **agent-native**.

### 4. Compliance Audit Format (Standard Moat)
Audit entries are designed for SOC 2, ISO 27001, and emerging AI agent regulations. We're talking to compliance vendors about ingesting TavSin logs directly. **First mover defines the format.**

---

## SUBMISSION COPY

### One-Liner (≤ 140 chars)
> The compliance layer for AI agents on Solana — policy-enforced smart wallets with on-chain spending controls and tamper-proof audit trails.

### Short (50 words)
> TavSin is a policy-enforced smart wallet for AI agents on Solana. Spending limits, vendor allowlists, and daily budgets are enforced on-chain — agents can't bypass them. Every transaction generates a tamper-proof audit entry. Plugs into Claude, Cursor, and any MCP client. The compliance layer the agent economy needs.

### Submission summary (150 words)
AI agents already pay for things on Solana — x402 standardized the payments, MCPay and Latinum built the rails. But every existing agent wallet is either fully locked or fully open. There's no wallet-level enforcement, no on-chain audit trail, no fleet visibility. This is the regulatory blocker keeping enterprises from deploying agents at scale.

TavSin solves it. A policy-enforced smart wallet where spending rules live on-chain: per-tx limits, daily budgets, vendor allowlists, time windows, escalation thresholds. The agent never holds keys. Every transaction goes through the TavSin program — approved actions execute, violations are denied and logged immutably. Plugs natively into Claude, Cursor, and any MCP client.

We're building the moat through shared blocklist registries, an agent reputation graph, and a compliance-grade audit format. Built with Anchor, TypeScript SDK, Next.js dashboard. Deployed on devnet. Mainnet next.

### Tags
`AI Agents` · `Compliance` · `Smart Wallet` · `MCP` · `x402` · `Solana` · `Spending Controls` · `Audit` · `Infrastructure`

---

## DELIVERY NOTES

- **Lead with regulation, not features.** "Your compliance officer won't let you deploy agents without this" lands harder than feature lists.
- **Name the judges' employers.** Mention Phantom, Squads, Reflect by name. They're listening for it.
- **USDC, not SOL.** Every demo and example uses USDC. That's where the money actually moves.
- **MCP demo is the wow moment.** Live Claude Desktop calling your tools = top 5% on presentation.
- **End on inevitability.** "Agents are going to move trillions" frames TavSin as a category, not a project.
- **Don't mention competitors as "competition."** Frame MCPay/Latinum/x402 as **partners** that need TavSin.
