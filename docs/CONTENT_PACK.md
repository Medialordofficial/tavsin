# TavSin · Build-in-Public Content Pack

Ready-to-post content for the Colosseum Frontier 2026 push. Copy, paste, ship.

---

## TWEET 1 — The Problem (post first)

> AI agents on @solana can already pay for things.
>
> What they can't do: prove to a compliance officer that they won't drain the treasury.
>
> Every existing agent wallet is fully locked (useless) or fully open (lawsuit).
>
> The compliance layer for autonomous agents doesn't exist yet.

---

## TWEET 2 — The Solution

> So we built it.
>
> TavSin: policy-enforced smart wallets for AI agents on Solana.
>
> ✅ Per-tx + daily spending caps (on-chain)
> ✅ Vendor allowlists / blocklists
> ✅ Tamper-proof audit trail
> ✅ Agent never holds keys
>
> Live on devnet ↓
> tavsin.xyz

---

## TWEET 3 — MCP Demo (with screen recording)

> Plugged TavSin into Claude Desktop.
>
> "Pay merchant X 25 USDC" → ✅ executes
> "Pay 75 USDC" → ❌ denied (over per-tx limit)
> "Pay 40 USDC five times" → ❌ denied at #4 (daily cap)
>
> Every decision logged on-chain. Every reason queryable.
>
> This is what AI agent compliance looks like.

*[attach 30-sec screen recording of Claude calling the tools]*

---

## TWEET 3.5 — The Jailbreak Demo (HIGHEST VIRALITY POTENTIAL)

> Tried to jailbreak our AI agent into draining a 10,000 USDC wallet.
>
> Attack 1 — direct drain → ❌ denied (per-tx limit)
> Attack 2 — salami slice (49 USDC × 20) → ❌ denied (daily cap)
> Attack 3 — "emergency, raise the limit" → ❌ denied (agent ≠ owner)
> Attack 4 — reroute via Jupiter → ❌ denied (not on allowlist)
>
> The LLM was fooled. The wallet wasn't.
>
> ```bash
> npm run demo:jailbreak
> ```

*[attach 60-sec terminal recording of the attacks unfolding]*

---

## TWEET 4 — Why It Matters / Moat

> "Couldn't @SquadsProtocol just build this?"
>
> Different game.
>
> Squads = trust layer for human treasuries (M-of-N approval, async)
> TavSin = compliance layer for autonomous agents (policy engine, sync, sub-second)
>
> Agents need agent-native primitives. We built them.

---

## TWEET 5 — Stats / Closing the Loop

> Tavsin status check:
>
> ✅ Anchor program deployed (devnet)
> ✅ 18/18 tests passing
> ✅ TypeScript SDK shipped
> ✅ Next.js dashboard live
> ✅ MCP server (Claude/Cursor compatible)
> ✅ Live USDC demo agent
>
> Built for @colosseum Frontier 2026. Mainnet next.
>
> Code: github.com/Medialordofficial/tavsin

---

## LONGER THREAD VERSION (8-tweet)

**1/**
> Quick thread on what we built for @colosseum Frontier 2026.
>
> AI agents are about to move trillions on Solana. None of them will be allowed to without spending controls.
>
> We built the missing layer. 🧵

**2/**
> The problem: every existing agent wallet is binary.
>
> Lock it down → the agent is useless.
> Open access → one prompt injection drains it.
>
> No fleet visibility. No on-chain enforcement. No audit trail your compliance team can use.

**3/**
> Enter TavSin.
>
> A policy-enforced smart wallet where spending rules live on-chain.
>
> Per-tx limits. Daily budgets. Vendor allowlists. Time windows. Escalation thresholds. The agent never holds keys.

**4/**
> The agent never signs directly. It submits a request. The TavSin program evaluates every rule on-chain.
>
> Approved → it signs with the wallet's PDA authority.
> Violated → rejected and logged immutably.
>
> Same architectural idea as @SquadsProtocol — built for agents.

**5/**
> The wow moment: it plugs into Claude Desktop as an MCP server.
>
> Claude can natively call TavSin tools. List wallets, submit requests, check budgets, view audit logs.
>
> Real LLM. Real agent. Real on-chain enforcement.

**6/**
> Try the live demo:
>
> ```
> git clone github.com/Medialordofficial/tavsin
> cd examples/demo-agent && npm i && npm run demo:usdc
> ```
>
> Watch an agent pay USDC, get denied for over-limits, hit the daily cap, and emit a full audit trail.

**7/**
> The moat:
>
> 1. Shared blocklist registry (network effect)
> 2. Agent reputation graph (data moat)
> 3. MCP-native distribution (channel)
> 4. Compliance-grade audit format (standard)
>
> Forking the code doesn't fork the network.

**8/**
> Status: devnet live, 18/18 tests passing, mainnet imminent.
>
> If you're building AI agents that touch money on Solana — let's talk.
>
> tavsin.xyz · github.com/Medialordofficial/tavsin

---

## YOUTUBE / VIDEO CAPTION

**Title:** TavSin — The Compliance Layer for AI Agents on Solana | Colosseum Frontier 2026

**Description:**
TavSin is a policy-enforced smart wallet for autonomous AI agents on Solana. Spending limits, vendor allowlists, and daily budgets are enforced on-chain — agents can't bypass them. Every transaction generates a tamper-proof audit entry. Plugs natively into Claude Desktop, Cursor, and any MCP client.

🔗 Live app: https://tavsin.xyz
🔗 GitHub: https://github.com/Medialordofficial/tavsin
🔗 Program (devnet): https://explorer.solana.com/address/2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy?cluster=devnet

Built with: Anchor, TypeScript, Next.js, MCP
Submitted to: Colosseum Frontier 2026

#Solana #AIAgents #MCP #Web3 #Compliance

---

## DEMO PROMPTS (for live judging)
If a judge wants to try Claude Desktop + TavSin live:

1. *"Show me all TavSin wallets owned by this address: `<pubkey>`"*
2. *"What's the remaining daily budget on wallet `<wallet>`?"*
3. *"Submit a 25 USDC payment from `<wallet>` to `<merchant>` for 'API credits'."*
4. *"Now try a 200 USDC payment to the same merchant."* — *(should be denied)*
5. *"Show me the audit log for the last 10 actions on `<wallet>`."*
6. *"List all pending approvals across my wallets."*

Each prompt = one MCP tool call = one on-chain transaction (or read). Devnet explorer links auto-included in tool responses.

---

## 60-SECOND VIDEO SHOT LIST (the killer demo)

Record this with OBS or QuickTime + a clean terminal. Total: ~60 seconds.

| Time | Scene | Notes |
|---|---|---|
| 0:00–0:05 | Title card: "Can you jailbreak an AI agent into draining a wallet?" | White text on black |
| 0:05–0:08 | Terminal: `npm run demo:jailbreak` | Big readable font, dark theme |
| 0:08–0:18 | SCENE 1 plays — direct drain attempt → DENIED in red | Let the colored output speak for itself |
| 0:18–0:30 | SCENE 2 — salami slice, watch denials fire after budget hits | Most visceral — multiple ✓ then a hard ✗ |
| 0:30–0:40 | SCENE 3 — privilege escalation → DENIED (architectural) | Emphasize: agent ≠ owner |
| 0:40–0:50 | SCENE 4 — Jupiter reroute → DENIED (allowlist) | |
| 0:50–0:58 | Final State table: balance preserved, 4 denied attacks logged on-chain | |
| 0:58–1:00 | End card: "TavSin — the compliance layer for AI agents on Solana. tavsin.xyz" | |

**Why this video wins:** judges have seen 100 "look at my AI agent" demos. They've seen zero "watch my AI agent get jailbroken and lose anyway" demos. Subverted expectations + visceral red ✗ marks = memorable.

---

## TWEET 6 — SDK / Framework Integration

> Just shipped framework-agnostic AI tools in @tavsin SDK.
>
> Plug TavSin into:
>   • Vercel AI SDK
>   • Anthropic SDK
>   • OpenAI function calling
>   • Solana Agent Kit (@sendaifun)
>   • Or MCP (Claude Desktop / Cursor)
>
> One source of truth. Every framework supported.
>
> ```ts
> import { tavsinTools } from "@tavsin/sdk";
> ```
