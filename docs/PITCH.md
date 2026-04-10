# Tavsin — Hackathon Pitch Script (Colosseum Frontier 2026)

> **Target: 2 minutes | No fluff. Problem → Gap → Product → Demo → Ask.**

---

## THE PITCH

**[HOOK — 8 sec]**

> "AI agents can now call APIs, browse the web, and write code. The next step? They move money. But right now, there's no wallet designed for how agents actually work."

**[THE GAP — 20 sec]**

The payment rails exist. x402, MCPay, Latinum — agents can pay for services on Solana today.

But here's what nobody built: a **wallet that enforces spending rules for agents.**

Right now, agent wallets have two modes: fully locked, or fully open. Developers hardcode spending limits in application code. There's no on-chain enforcement. No per-agent budgets. No anomaly detection. No audit trail.

If you're running 50 agents — you have zero visibility into what they're spending and zero way to stop one that's misbehaving.

**[TAVSIN — 20 sec]**

Tavsin is a **policy-enforced smart wallet for AI agents on Solana.**

Tavsin IS the wallet. Agent funds live inside a Tavsin PDA. Spending policies — per-transaction limits, daily budgets, approved programs, token blocklists, escalation thresholds, time windows — are baked into the wallet itself.

When an agent wants to spend, it calls the Tavsin program. Tavsin checks every rule on-chain. If it passes — Tavsin signs with the PDA's authority and the transaction executes. If it violates any rule — rejected and logged.

The agent never holds keys. It cannot bypass the policy. This is how Squads works for human multisig — Tavsin does it for autonomous agents.

**[DEMO — 40 sec]**

*[Screen share devnet]*

Here's a live agent with a Tavsin wallet. Policy: 50 USDC max per transaction, 500 USDC daily cap, only Jupiter swaps allowed.

Watch: the agent proposes a 30 USDC swap on Jupiter. *[tx goes through]* Tavsin checked the policy, signed with the PDA authority, Jupiter swap executed. Logged.

Now the agent tries to send 200 USDC. *[tx blocked]* Rejected — exceeds per-tx limit. The Tavsin program refused to sign. Logged.

Now the agent tries Raydium. *[tx blocked]* Rejected — program not on allowlist. Logged.

Every decision is on-chain. Here's the fleet dashboard — per-agent spend tracking, rolling daily windows, every approval and rejection, kill switch to freeze any agent instantly.

**[WHY NOW — 15 sec]**

The Solana AI agent cluster has 325+ projects. MCP created thousands of tool servers. x402 is the payment standard. Agents are already spending money on-chain.

But zero projects have built the wallet governance layer. We checked — Colosseum Copilot confirmed it. MCPay and Latinum delegate budget management entirely to developers. The smart wallet for agents doesn't exist.

**[BUSINESS — 10 sec]**

Revenue: 0.05-0.1% on policy-checked transactions, plus SaaS for the fleet dashboard. Every AI agent that moves value on Solana needs a Tavsin wallet. The SDK is open-source — developers adopt it because it de-risks their entire agent stack.

**[CLOSE — 7 sec]**

> "Agents are moving money. Tavsin is the wallet that makes sure they move it right."

---

**Total: ~2 minutes**

---

## Pitch Delivery Notes

- **Frame it as a wallet, not middleware.** "Tavsin IS the wallet" is a much stronger pitch than "Tavsin sits in front of a wallet." Judges understand wallets.
- **Say "325 projects" and "Copilot confirmed."** Shows you did the research on Colosseum's own data.
- **Demo over deck.** Judges review hundreds of submissions. A live devnet demo will be top 5% on presentation quality alone.
- **Name competing projects by name.** "MCPay won Cypherpunk. Latinum won Breakout AI. Neither built spending governance." Shows founder-quality competitor awareness.
- **Don't say "trust layer" or "policy engine."** Say "smart wallet for agents." Concrete, tangible, judges get it instantly.
- **Compare to Squads.** Everyone on the panel knows Squads. "Squads for humans, Tavsin for agents" is a one-liner that sticks.

---

# Killer Submission Summary

## One-Liner

**Tavsin is a policy-enforced smart wallet for AI agents on Solana — enforcing per-agent budgets, vendor limits, and anomaly detection at the wallet level, not in application code.**

## Short Description (50 words)

Tavsin is a smart wallet for AI agents on Solana. Agent funds live inside Tavsin PDAs with spending policies baked in — per-tx limits, daily budgets, program allowlists, escalation rules. Agents call the Tavsin program to spend; it evaluates policy on-chain and signs or blocks. Every decision is immutably logged.

## Submission Summary (150 words)

AI agents can pay for services on Solana today — x402, MCPay, and Latinum built the payment rails. But none of them control *how much* an agent can spend. Developers hardcode limits in application code. There is no wallet-level enforcement, no per-agent budgets, and no anomaly detection.

Tavsin is the policy-enforced smart wallet that fills this gap. Agent funds live inside Tavsin PDAs owned by the Tavsin program. Spending policies — per-transaction limits, daily budgets, program allowlists, token blocklists, escalation thresholds, time windows — are stored on-chain alongside the wallet.

When an agent requests a transaction, the Tavsin program evaluates every rule. If approved, it signs with the PDA's authority and CPI-invokes the target program. If violated, the transaction is rejected and logged.

The agent never holds keys. It cannot bypass the policy. Built with: Anchor (Rust), TypeScript SDK, Next.js dashboard, Helius RPC.

## Extended Summary (300 words)

The Solana AI agent ecosystem has 325+ projects and is the densest agent infrastructure cluster in crypto. x402 is standardizing agent-to-service payments. MCPay (1st Place Stablecoins, Cypherpunk) and Latinum (1st Place AI, Breakout) have built the payment rails. MCP has created thousands of tool servers that agents can pay for autonomously.

One critical layer is completely absent: **wallet-level spending governance.** No project has built an on-chain wallet that enforces agent spending policies. Every existing solution delegates budget management to application code — hardcoded limits that agents can bypass, with no audit trail, no anomaly detection, and no fleet-level visibility.

**Tavsin is a policy-enforced smart wallet for AI agents on Solana.** It enforces spending rules at the wallet level — not in middleware, not in application code.

Agent funds live inside Tavsin smart wallet PDAs owned by the Tavsin program. Policies include: per-transaction limits, rolling daily/weekly budget caps, approved program allowlists, token mint blocklists, escalation thresholds (requiring human confirmation above N USDC), and time-window restrictions. The wallet owner (the user or operator) controls the policy; the agent cannot modify or bypass it.

When an AI agent requests a transaction, it calls the Tavsin program. The evaluate_tx instruction checks all policy rules. If approved, Tavsin signs with the PDA's authority and CPI-invokes the target program (Jupiter, Raydium, etc.). If violated, the transaction is rejected and logged. A spend tracker PDA maintains rolling spend totals per agent, enabling budget enforcement without off-chain state.

Every decision is recorded on-chain in an immutable audit log — creating verifiable spending history per agent. This audit trail becomes the foundation for agent reputation and eventually credit scoring.

Revenue: 0.05-0.1% fee on policy-checked transactions + SaaS dashboard for fleet operators. The fleet dashboard includes real-time spend charts, anomaly alerts, kill switch, and policy templates.

Built with: Anchor (Rust), TypeScript SDK (`@tavsin/sdk`), Next.js dashboard + landing page on Vercel, Helius RPC, Bankrun for testing.

## Tags

`AI Agents` · `Smart Wallet` · `Solana` · `Policy Engine` · `x402` · `MCP` · `Infrastructure` · `DeFi` · `Spending Controls`
