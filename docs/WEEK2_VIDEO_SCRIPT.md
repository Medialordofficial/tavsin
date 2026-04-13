# TavSin — Week 2 Demo Video Script

**Duration target:** 3–5 minutes
**Format:** Screen recording with voiceover

---

## Opening (15s)

> "This is Week 2 of TavSin — the governed smart-wallet protocol for autonomous AI agents on Solana. Last week we deployed the on-chain program and basic dashboard. This week: full end-to-end flows, Jupiter DEX integration, and a kill switch demo."

---

## Section 1: Dashboard Overview (45s)

**Show:** tavsin.xyz/dashboard

- Connect wallet → show fleet stats: wallet count, total balance, approval rate, frozen count
- Point out the **Fleet Activity chart** — balance bars with utilization overlay
- Show the **Approval Queue** — fleet-wide pending reviews
- Click into a wallet → show the full detail page

**Key line:**
> "Every metric you see here is derived from on-chain state. No database, no indexer — just direct Solana RPC reads."

---

## Section 2: Agent Bot E2E (60s)

**Show:** Terminal running `npx tsx scripts/agent-bot.ts`

Walk through the 7 steps:
1. Create wallet with owner + agent keypair
2. Fund wallet with 0.1 SOL
3. Set approval threshold at 0.04 SOL
4. Agent submits 0.05 SOL request → **Pending** (above threshold)
5. Owner approves
6. Agent executes → recipient receives funds
7. Audit trail: 3 entries logged

**Key line:**
> "The agent never holds keys. It can only spend what the policy allows, and every decision is immutably logged on-chain."

---

## Section 3: Kill Switch (45s)

**Show:** Terminal running `npx tsx scripts/kill-switch.ts`

Walk through the flow:
1. Normal request succeeds
2. Owner freezes wallet → `frozen: true`
3. Agent tries again → **Rejected: Wallet frozen**
4. Owner unfreezes → agent can operate again
5. Audit trail shows the frozen denial

**Key line:**
> "One transaction to freeze. The agent is cut off instantly. One transaction to restore. Human stays in control."

---

## Section 4: Jupiter DEX Integration (60s)

**Show:** Terminal running `npx tsx scripts/jupiter-swap.ts`

Walk through:
1. Create wallet allowing Jupiter program
2. Fetch real Jupiter quote (SOL → USDC)
3. Show route, accounts, instruction data
4. Submit as governed request through TavSin policy engine
5. Auto-approved within limits, audit logged

Then **show the dashboard** Jupiter Swap Card:
- Token selector, amount input, slippage control
- Get Jupiter quote → see route and price
- Submit as governed swap request

**Key line:**
> "This is real DeFi through governed rails. The agent can swap on Jupiter, but only within the limits the owner set. Every swap is auditable."

---

## Section 5: What's On-Chain (30s)

Quick montage of evidence:
- 12 instructions in the program
- 7 policy checks per transaction
- Full SPL token support via CPI
- Per-recipient counterparty rules
- Immutable audit trail
- 11/11 integration tests passing

**Key line:**
> "This isn't a mockup. Every feature is deployed to devnet, tested, and live on the dashboard right now."

---

## Closing (15s)

> "Week 2: full e2e flows, kill switch, Jupiter integration, fleet dashboard with charts. Next week: mainnet prep, SDK polish, and the final submission. TavSin — governed capital for autonomous agents."

**Show:** GitHub repo, tavsin.xyz

---

## Recording Checklist

- [ ] Solana devnet wallet connected with funded wallets
- [ ] Terminal ready with scripts (agent-bot, kill-switch, jupiter-swap)
- [ ] Dashboard loaded at localhost:3000 or tavsin.xyz
- [ ] Screen recording tool ready (OBS / QuickTime)
- [ ] Mic check
