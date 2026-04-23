# TavSin — One-Page Pitch

**Tagline:** _The trust layer for the agent economy._

**One line:** TavSin is a policy-enforced smart wallet that lets AI agents move money on Solana — within hard rules the owner sets — and logs every decision on-chain.

---

## The problem

AI agents are about to move trillions of dollars. Every existing wallet on
Solana was designed for **humans signing in front of a screen**. There is
no programmable answer to "the agent got jailbroken — stop it before funds
move." The industry's current answer is "trust the prompt."

## The gap

| Layer | Who built it | What's missing |
| --- | --- | --- |
| Payment rails | MCPay, Latinum, x402 | No spending governance |
| Multisig | Squads | Built for humans, not agents |
| Risk warnings | Blowfish | Passive, not enforcing |
| Key custody | Turnkey, Privy | No transaction-level policy |
| **Wallet governance for agents** | **— (missing) —** | **TavSin** |

## The solution

A smart wallet program with seven on-chain policy checks per transaction:
per-tx ceiling, daily rolling budget, program allowlist, time window,
freeze status, per-recipient counterparty rules, and approval threshold.
The agent is bounded by the program — not by application code, not by
prompt engineering, not by trust.

## Proof

- **17 instructions, 14 events, 28 tests passing** on Anchor 1.0.
- **Live on Solana devnet** at `2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy`.
- **Live deny feed** at <https://tavsin.xyz/live> — every denial streams in
  real time from program logs. No indexer required.
- **Jailbreak demo:** four LLM-attack patterns get denied on-chain before
  funds move. `npm run demo:jailbreak`.
- **Composable:** Squads vault as owner, Realms governance as owner,
  Token-2022 transfer hook for issuer-mandated policy.

## Why now

- 325+ Solana AI agent projects shipped in the last 12 months.
- Anthropic / Vercel / LangChain all standardizing on agentic spending.
- x402 is the payment standard. There is no **policy** standard. We are.
- Regulators are circling agent-driven payments. On-chain policy is the
  only defensible compliance story.

## Differentiation moats

1. **Funds never leave the program.** PDA custody pinned by the request
   payload hash. The agent cannot redirect or escalate.
2. **Counterparty policy.** Per-recipient overrides. No competitor has
   this in the agent space.
3. **Owner-side controls.** `freeze_wallet`, `panic_drain`, `rotate_agent`
   — instant, on-chain, irrevocable.
4. **Composable owner.** Drop in a Squads vault or a Realms governance PDA
   as the owner. Zero TavSin code changes. The asset-layer story (Token-2022
   transfer hook) means issuers can mandate TavSin from the mint itself.

## Business

- **Free for open-source agents.** Adoption land-grab on devnet → mainnet.
- **Paid tier:** managed RPC, audit-trail indexing, compliance exports,
  Squads-vault provisioning, SOC-2-ready logs. Targeting agent platforms
  and DAO treasuries.
- **Long-term:** insurance underwriting on policy-bounded wallets becomes
  possible because risk is quantified on-chain.

## The ask

We are raising a pre-seed round to:

1. Ship mainnet (security audit + bug bounty).
2. Hire a Solana security engineer and a DevRel.
3. Land the first 10 production integrations with agent platforms.

## Try it

- **App:** <https://tavsin.xyz>
- **Live deny feed:** <https://tavsin.xyz/live>
- **Demo:** `cd examples/demo-agent && npm run demo:jailbreak`
- **Code:** <https://github.com/Medialordofficial/tavsin>
