# Aegis — Hackathon Pitch Script (Colosseum Frontier 2026)

> **Target: 2 minutes | No fluff. Problem → Gap → Product → Demo → Ask.**

---

## THE PITCH

**[HOOK — 8 sec]**

> "AI agents can now call APIs, browse the web, and write code. The next step? They move money. But right now, there's no way to control how much they spend."

**[THE GAP — 20 sec]**

The payment rails exist. x402, MCPay, Latinum — agents can pay for services on Solana today.

But here's what nobody built: **who controls the spending?**

Right now, every AI agent with a wallet has two modes: fully locked, or fully open. Developers hardcode spending limits in application code. There's no on-chain enforcement. No per-agent budgets. No anomaly detection. No audit trail.

If you're running 50 agents — you have zero visibility into what they're spending and zero way to stop one that's misbehaving.

**[AEGIS — 20 sec]**

Aegis is the **on-chain spending policy engine for AI agents on Solana.**

Policies are Solana program accounts — PDAs that store spending rules per agent. Per-transaction limits, daily budgets, approved programs, token blocklists, escalation thresholds, time windows.

When an agent wants to execute a transaction, it goes through Aegis via CPI. The program checks every rule on-chain. If it passes — execute. If it hits an escalation threshold — hold and notify the owner. If it violates any rule — reject and log.

The agent cannot bypass this. It's protocol-level, not application code.

**[DEMO — 40 sec]**

*[Screen share devnet]*

Here's a live agent. I gave it a policy: 50 USDC max per transaction, 500 USDC daily cap, only Jupiter swaps allowed.

Watch: the agent proposes a 30 USDC swap on Jupiter. *[tx goes through]* Approved. Logged.

Now the agent tries to send 200 USDC to a random address. *[tx blocked]* Rejected — exceeds per-tx limit. Logged.

Now the agent tries to call Raydium. *[tx blocked]* Rejected — program not on allowlist.

Every decision is on-chain. I can see the full audit trail here. Per-agent spend tracking, rolling daily windows, every approval and rejection.

**[WHY NOW — 15 sec]**

The Solana AI agent cluster has 325+ projects. MCP created thousands of tool servers. x402 is the payment standard. Agents are already spending money on-chain.

But zero projects have built the governance layer. We checked — Colosseum Copilot confirmed it. MCPay and Latinum delegate budget management entirely to developers. The policy engine is missing.

**[BUSINESS — 10 sec]**

Revenue: 0.05-0.1% on policy-checked transactions, plus SaaS for the dashboard. Every AI agent that moves value on Solana needs this. The SDK is open-source — developers adopt it because it de-risks their entire agent stack.

**[CLOSE — 7 sec]**

> "The payment rails are built. Agents are spending money. Aegis makes sure they spend it right."

---

**Total: ~2 minutes**

---

## Pitch Delivery Notes

- **Open with the gap, not fear.** Don't say "billions lost." Say "the payment layer exists, the control layer doesn't." This is smarter and judges will respect it.
- **Say "325 projects" and "Copilot confirmed."** Shows you did the research on Colosseum's own data.
- **Demo over deck.** Judges review hundreds of submissions. A live devnet demo will be top 5% of submissions on presentation quality alone.
- **Name the competing projects by name.** "MCPay won Cypherpunk. Latinum won Breakout AI. Neither built spending governance." This shows competitor awareness that screams founder quality.
- **Don't say "trust layer."** Too vague. Say "spending policy engine." It's concrete and immediately understood.

---

# Killer Submission Summary

## One-Liner

**Aegis is the on-chain spending policy engine for AI agents on Solana — enforcing per-agent budgets, vendor limits, and anomaly detection at the protocol level.**

## Short Description (50 words)

Aegis enforces spending policies for AI agents directly on Solana. Per-agent budgets, per-transaction limits, program allowlists, and escalation rules are stored as on-chain PDAs. Agents execute transactions through Aegis via CPI — passing transactions are executed, violations are blocked. Every decision is logged immutably. The missing governance layer for agent payments.

## Submission Summary (150 words)

AI agents can pay for services on Solana today — x402, MCPay, and Latinum built the payment rails. But none of them control *how much* an agent can spend. Developers hardcode limits in application code. There is no on-chain enforcement, no per-agent budgets, and no anomaly detection.

Aegis is the spending policy engine that fills this gap. Policies are stored as Solana PDAs — per-transaction limits, daily budgets, program allowlists, token blocklists, escalation thresholds, and time windows. When an agent proposes a transaction, it passes through the Aegis Solana program via CPI. Rules are evaluated on-chain. Passing transactions execute. Violations are blocked and logged.

The agent cannot bypass the policy — enforcement is at the protocol level, not in application code. Every decision (approve, escalate, reject) is recorded in an immutable on-chain audit log.

Built with: Anchor (Rust), TypeScript SDK, Helius RPC.

## Extended Summary (300 words)

The Solana AI agent ecosystem has 325+ projects and is the densest agent infrastructure cluster in crypto. x402 is standardizing agent-to-service payments. MCPay (1st Place Stablecoins, Cypherpunk) and Latinum (1st Place AI, Breakout) have built the payment rails. MCP has created thousands of tool servers that agents can pay for autonomously.

One critical layer is completely absent: **spending governance.** No project has built on-chain enforcement of agent spending policies. Every existing payment solution delegates budget management to application code — hardcoded limits that agents can bypass, with no audit trail, no anomaly detection, and no fleet-level visibility.

**Aegis is the on-chain spending policy engine for AI agents on Solana.** It enforces spending rules at the protocol level via a Solana program.

Policies are stored as PDAs (Program Derived Addresses) and include: per-transaction limits, rolling daily/weekly budget caps, approved program allowlists, token mint blocklists, escalation thresholds (requiring human confirmation above N USDC), and time-window restrictions. The policy owner (the user or operator) controls the policy; the agent cannot modify or bypass it.

When an AI agent proposes a transaction, it calls the Aegis program via CPI. The evaluate_tx instruction checks all policy rules against the proposed transaction. Passing transactions are executed and logged. Escalated transactions are held pending owner confirmation. Violations are rejected and logged. A spend tracker PDA maintains rolling spend totals per agent, enabling budget enforcement without off-chain state.

Every decision is recorded on-chain in an immutable audit log — creating verifiable spending history per agent. This audit trail becomes the foundation for agent reputation and eventually credit scoring.

Revenue model: 0.05-0.1% fee on policy-checked transactions + SaaS dashboard for fleet operators. Open-source SDK drives developer adoption.

Built with: Anchor (Rust), TypeScript SDK (`@aegis/sdk`), Next.js dashboard, Helius RPC, Bankrun for testing.

## Tags

`AI Agents` · `Security` · `Solana` · `Policy Engine` · `x402` · `MCP` · `Infrastructure` · `DeFi` · `Spending Controls`
