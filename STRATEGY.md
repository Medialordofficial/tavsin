# AEGIS — COLOSSEUM FRONTIER HACKATHON: STRATEGIC RESEARCH & BATTLE PLAN

> **CONFIDENTIAL** — Internal strategy document
> Last updated: April 8, 2026 (v2 — Post-Copilot research)

---

## 0. WHAT CHANGED (v2)

We ran the idea through Colosseum Copilot's published data and found:

1. The "AI Agent Payments" Copilot example **literally names our gap as the #1 underexplored opportunity**
2. The cluster "Solana AI Agent Infrastructure" has **325 projects** — but **zero have built spending governance**
3. MCPay (1st Place Stablecoins/Cypherpunk, C4 Accelerator) and Latinum (1st Place AI/Breakout) are the closest — but both **delegate budget management to application code**
4. Copilot explicitly states: *"Spending policy engine / risk layer: Nobody's built it"*
5. The top opportunity is described as **"Brex for AI Agents"** — spending controls + policy enforcement

**We pivoted from vague "trust layer" to concrete "on-chain spending policy engine for AI agents."**

---

## 0.1 LOOPHOLES WE FIXED

| Loophole in v1 | Why it would lose | Fix in v2 |
|---|---|---|
| "Trust layer" framing | Too abstract — judges can't visualize it | "Spending policy engine" — concrete, demo-able |
| No mention of x402, MCP, MCPay | Ignores the existing ecosystem that judges know | Positioned as the missing layer on top of x402/MCPay |
| "AI agent executes blockchain transactions" | Covers everything, says nothing | "Per-agent budgets, per-tx limits, program allowlists" |
| Off-chain middleware design | Agents could bypass; not trustless | On-chain Solana program via CPI — unbypassable |
| "Risk simulation" as a feature | Sounds like Blowfish; already exists | Cut. Focus on policy enforcement, not risk scoring |
| Multi-chain in scope | Scope creep; judges want depth | Solana only. Deep, not wide |
| No revenue model | Judges look for viable business | 0.05-0.1% on policy-checked txs + SaaS dashboard |
| No existing ecosystem awareness | Looks like you didn't research | Name competitors by name: MCPay, Latinum, Agent-Cred |
| "AI-powered intent execution" | That's the agent's job, not ours | Aegis doesn't parse intents — it enforces policies |
| Generic architecture diagram | Pretty but says nothing technical | Specific: PDAs, CPI, spend tracker, audit log |

## 1. HACKATHON OVERVIEW

### Solana Frontier Hackathon
- **Dates:** April 6 – May 11, 2026 (5 weeks)
- **Format:** Online, global
- **Platform:** arena.colosseum.org
- **Powered by:** Colosseum + Solana Foundation

### Prizes
| Prize | Amount |
|---|---|
| **Grand Champion** | $30,000 |
| **Top 20 Standout Teams** | $10,000 each ($200,000 total) |
| **Best Public Goods** | $10,000 |
| **Best University Team** | $10,000 |

### What Winners Get Beyond Prizes
- Interview for **Colosseum Accelerator** (10+ teams accepted)
- **$250,000 pre-seed funding** per accelerator team
- Exclusive founder network
- 1:1 mentorship
- Substantial AI credits
- IRL support at Colosseum's San Francisco office
- **Private Demo Day** pitching to leading crypto VCs

### Key Rules
- **No tracks, no bounties.** Projects judged purely on impact, viability, and execution.
- Must integrate with **Solana** in some capacity
- Must be a **new project** (started during/for the hackathon)
- Working demo on **devnet** is expected
- Submission includes: **pitch video (< 3 min)**, GitHub repo, product description
- Weekly updates required during the hackathon

### Judging Criteria (from "How to Win" guide)
1. **Full-time founder intent** — Teams who plan to build this as a real startup
2. **Viable business model** — Product with potential revenue path
3. **Working demo** — Functional product on Solana devnet
4. **Product presentation** — Concise Loom video under 3 min
5. **Market opportunity** — Enabling new markets via crypto or improving existing ones
6. **Team quality** — Technical + non-technical mix, ideally 3+ members

### Notable Judges
- **Anatoly Yakovenko** — Cofounder, Solana
- **Lily Liu** — President, Solana Foundation
- **Clay Robbins & Matty Taylor** — Cofounders, Colosseum
- Judges from: Phantom, Squads Labs, Raydium, Drift, Arcium, Metaplex, Reflect, Axiom, EasyA, Ellipsis Labs, Anza, and more

### Relevant Build Paths (from Resources page)
- **Agents + Tokenization** — "Build AI agents with onchain identity and economic functionality"
- **Treasury + Security** — "Secure assets, manage treasuries, and run financial operations"
- **DeFi + Stablecoins** — "Build with interest-bearing dollars and stablecoin primitives"

**Aegis spans all three.** This is a massive advantage — it's a multi-category project at the intersection of AI, security, and DeFi.

---

## 2. COMPETITOR LANDSCAPE (UPDATED WITH COPILOT DATA)

### What Colosseum Copilot Revealed

The AI Agent Payments example on Copilot (docs.colosseum.com/copilot/examples/ai-agent-payments) is the most relevant intelligence we have. Key findings:

**Cluster stats:**
- "Solana AI Agent Infrastructure" cluster: **crowdedness 325** (325 projects)
- x402 is the converging standard for agent payments
- MCPay won 1st Place Stablecoins (Cypherpunk) + C4 Accelerator
- Latinum won 1st Place AI (Breakout) at $25K

**What exists (payment rails):**
- MCPay — x402 MCP tool monetization (1 person team, @microchipgnu)
- Latinum — Payment middleware + MCP-compatible wallet (live at latinum.ai)
- Corbits.dev — x402 API payment proxy (2nd Place Infrastructure, Cypherpunk)
- Agent-Cred — Hotkey/coldkey dual-key for agent wallets
- AEP — Service discovery → price negotiation → escrow → settlement

**What does NOT exist (Copilot's own words):**
> "No project has built spending policy engines (per-category limits, anomaly detection, compliance rules)"
> "No project has built credit rails for agents"
> "Convergent finding: Security model for agent wallets is unsolved"
> "MCPay and Latinum delegate budget management to developers (hardcoded limits in code). Neither provides a policy engine, a dashboard, or a credit facility."

**Copilot's top opportunity:** "Brex for AI Agents" — spending controls, policy enforcement, agent fleet management.

**THIS IS EXACTLY AEGIS.**

### Updated Competitor Map

| Layer | What exists | Gap (Aegis) |
|---|---|---|
| **Payment protocol** | x402 (Coinbase, 2025) | Payment protocol doesn't control spending |
| **Payment rails** | MCPay, Latinum, Corbits | Rails don't enforce budgets |
| **Wallet creation** | Turnkey (TEE-based) | Creating a wallet ≠ governing it |
| **Key separation** | Agent-Cred (hotkey/coldkey) | Key architecture ≠ spending rules |
| **Scam detection** | Blowfish (passive warnings) | Warnings to humans ≠ enforcement for agents |
| **Multi-party approval** | Squads (human multisig) | Human consensus ≠ automated policy |
| **Spending policy engine** | **NOTHING** | **← AEGIS** |

### Why This Positioning Wins

1. **Copilot literally calls it the #1 gap** — we're not guessing, we have data
2. **325-project cluster, zero competitors in our specific layer** — the entire ecosystem is building rails, nobody is building governance
3. **MCPay and Latinum validate demand** — they exist, they're funded, and they explicitly lack what we build
4. **x402 adoption creates urgency** — as more agents transact via x402, the "who controls spending" question gets louder
5. **On-chain enforcement is the moat** — off-chain policy middleware can be bypassed; CPI-enforced policies on Solana cannot

---

## 3. RISK ANALYSIS & FAILURE POINTS (v2)

### Risk 1: "Just a Middleware / Off-Chain Service"
**Severity: CRITICAL** → **RESOLVED**
- v1 had Aegis as off-chain middleware agents could bypass
- v2 is an **on-chain Solana program** using CPI — agent wallets MUST call Aegis to transact
- Policy PDAs are on-chain, spend tracking is on-chain, audit log is on-chain
- This is the #1 thing that differentiates us from MCPay's hardcoded-in-code approach

### Risk 2: "Looks Like Blowfish / Squads"
**Severity: MEDIUM**
- Blowfish: passive warnings for humans → Aegis: active enforcement for agents (agents can't read warnings)
- Squads: multi-party human consensus → Aegis: automated policy evaluation (no human in the loop)
- **Demo must show the difference live**: "Here's what happens when an agent hits a Blowfish warning [nothing, it proceeds]. Here's what happens with Aegis [transaction blocked on-chain]."

### Risk 3: "Too Narrow / Not a Business"
**Severity: MEDIUM**
- Copilot data proves demand: 325 projects need this, MCPay/Latinum are funded and lack it
- Revenue: 0.05-0.1% on policy-checked txs + SaaS dashboard for fleet operators
- Expansion: credit rails for agents (Copilot's #2 opportunity) feeds into v2

### Risk 4: Another Team Builds the Same Thing
**Severity: LOW**
- Copilot says nobody has built it across 5,400+ submissions
- Our speed advantage: we start with Copilot's exact thesis already framed
- Even if someone builds adjacent, execution + positioning wins

### Risk 5: Team Size / Capacity
**Severity: HIGH if solo**
- Average winning team: 3+ members
- Use Colosseum Cofounder Directory + Discord to recruit
- Ideal: 1 Anchor/Rust dev + 1 TypeScript/SDK dev + 1 frontend/pitch
- Solo fallback: CLI demo + on-chain program, skip dashboard frontend

### Risk 6: Weak Demo / Presentation
**Severity: HIGH**
- Demo script is concrete (see PITCH.md): create policy → agent swaps 30 USDC ✅ → agent tries 200 USDC ❌ → agent tries Raydium ❌
- Judges must SEE the block happen on-chain, not hear about it
- Use Loom, keep under 3 min, show terminal + explorer side by side

---

## 4. TECHNICAL ARCHITECTURE (v2)

### On-Chain Program (Anchor/Rust)

```
aegis-program/
├── instructions/
│   ├── create_policy.rs    — Owner defines policy PDA (limits, allowlist, budget period)
│   ├── check_transaction.rs — CPI entry: agent calls before executing tx
│   ├── record_spend.rs     — Updates cumulative spend tracker after successful tx
│   └── revoke_agent.rs     — Owner freezes an agent immediately
├── state/
│   ├── policy.rs           — Policy PDA: per-tx limit, daily budget, program allowlist
│   ├── spend_tracker.rs    — Rolling spend tracker per agent per budget period
│   └── audit_entry.rs      — On-chain log of every check (approved/denied + reason)
└── errors.rs               — Custom error codes (ExceedsLimit, ProgramNotAllowed, BudgetExhausted)
```

### CPI Flow (How It Works)

```
Agent wallet → calls target program (e.g., Jupiter swap)
         ↓
Target program CPI → aegis::check_transaction(policy_pda, amount, target_program_id)
         ↓
Aegis program:
  1. Load policy PDA for this agent
  2. Check: amount ≤ per_tx_limit?
  3. Check: cumulative_spend + amount ≤ daily_budget?
  4. Check: target_program_id ∈ program_allowlist?
  5. If all pass → return Ok, record spend
  6. If any fail → return Err(AegisError::PolicyViolation)
         ↓
Target program: proceeds only if Aegis returns Ok
```

### Key Design Decisions

1. **PDAs, not accounts** — Policies stored as PDAs derived from `[owner_pubkey, agent_pubkey, "policy"]`. No rent drama.
2. **CPI enforcement** — Target programs call Aegis via CPI. Agent can't bypass because the target program requires the Aegis check.
3. **Budget periods** — Spend tracker resets per configurable period (hourly/daily/weekly). Uses Solana clock sysvar.
4. **Audit log** — Every check emits a program log + writes an audit PDA. On-chain, immutable, queryable.

### Tech Stack

| Component | Technology | Why |
|---|---|---|
| Smart Contract | Anchor (Rust) | Standard for Solana programs, judges expect it |
| SDK | TypeScript (`@aegis/sdk`) | Wraps CPI calls, policy CRUD, audit queries |
| Frontend | Next.js | Minimal dashboard — policy management + audit viewer |
| RPC | Helius | 50% hackathon discount, built-in DAS API |
| Testing | Bankrun + anchor test | Fast local testing without validator overhead |
| AI Agent Demo | TypeScript + OpenAI | Simple agent that proposes swaps, calls Aegis SDK |

---

## 5. SPRINT PLAN (v2 — 5 Weeks)

| Week | Focus | Deliverable | Weekly Update |
|---|---|---|---|
| **Week 1** (Apr 6-12) | Anchor program skeleton + policy PDA | `create_policy` + `check_transaction` instructions working on localnet | "Policy engine deployed to devnet. Here's the PDA structure." |
| **Week 2** (Apr 13-19) | Spend tracking + CPI integration | `record_spend` + budget period logic + CPI from mock program | "Spending limits enforced via CPI. Agent blocked live on devnet. [Video]" |
| **Week 3** (Apr 20-26) | TypeScript SDK + agent demo | `@aegis/sdk` package, demo agent that swaps on Jupiter via Aegis | "End-to-end: AI agent → policy check → swap executed or blocked. [Video]" |
| **Week 4** (Apr 27-May 3) | Dashboard + audit viewer | Next.js dashboard: create policies, view audit log, revoke agents | "Dashboard live. Fleet operators can manage 10 agents from one screen." |
| **Week 5** (May 4-11) | Polish + pitch video + submission | Bug fixes, README cleanup, Loom video, submission on arena | "Submitted. Here's our pitch video and demo link." |

### Week 1 Detailed Breakdown

| Day | Task |
|---|---|
| Day 1 | `anchor init aegis-program`, define Policy and SpendTracker state structs |
| Day 2 | Implement `create_policy` instruction (owner sets limits) |
| Day 3 | Implement `check_transaction` instruction (CPI-callable) |
| Day 4 | Write tests: policy creation, valid tx check, blocked tx check |
| Day 5 | Deploy to devnet, verify with Solana Explorer |
| Day 6 | Start TypeScript SDK scaffold |
| Day 7 | Buffer / catchup / first weekly update |

---

## 6. WHAT JUDGES LOOK AT IN GITHUB REPOS

From Colosseum's FAQ and guide:

- **Code quality** — Clean Anchor code, idiomatic Rust, proper error handling
- **README** — Clear "spending policy engine" framing (already done)
- **Commit history** — Regular commits throughout 5 weeks (NOT a last-day dump)
- **Working demo** — Program deployed to devnet with verifiable address
- **Documentation** — Setup instructions that judges can follow to test
- **Architecture** — Clear program structure, SDK separate from frontend

**Repo structure to aim for:**
```
aegis/
├── programs/aegis/          — Anchor program (Rust)
├── sdk/                     — @aegis/sdk TypeScript package
├── app/                     — Next.js dashboard
├── demo/                    — Demo agent script (run to see it work)
├── tests/                   — Anchor tests
├── README.md                — Judge-facing (already written)
├── PITCH.md                 — Pitch script + summaries
└── STRATEGY.md              — This file (internal)
```

---

## 7. NARRATIVE HOOKS FOR SPECIFIC JUDGES

| Judge | Hook |
|---|---|
| **Anatoly Yakovenko** (Solana) | "Aegis makes Solana the default chain for agent commerce — on-chain policy enforcement that EVM can't replicate at this speed/cost" |
| **Lily Liu** (Solana Foundation) | "325 agent projects on Solana, zero governance layer. Aegis is the missing infrastructure." |
| **Squads Labs judge** | "Squads = multi-party human approval. Aegis = automated policy for non-human agents. Complementary — we integrate, not compete." |
| **Phantom judge** | "Every Phantom user who delegates to an AI agent needs spending controls. Aegis is the policy engine Phantom integrates." |
| **Drift / Raydium judges** | "DeFi protocols that want agent users need to ensure agents don't drain pools. Aegis enforces per-agent, per-protocol limits." |
| **Clay Robbins** (Colosseum) | "Full-time founder intent. This is our startup, not a weekend project. Copilot confirmed the gap — we're filling it." |

---

## 8. IMMEDIATE ACTION ITEMS (NEXT 48 HOURS)

- [ ] Register on arena.colosseum.org for Frontier hackathon
- [ ] Run idea through Colosseum Copilot (live version at arena)
- [ ] Create @AegisProtocol Twitter/X account
- [ ] Join Colosseum Discord
- [ ] Set up Anchor development environment (`anchor init aegis-program`)
- [ ] Set up Helius RPC (50% off hackathon deal)
- [ ] Find 1-2 cofounders via Colosseum Cofounder Directory + Discord
- [ ] Deploy empty Anchor program to devnet
- [ ] First public tweet: "Building the spending policy engine for AI agents on Solana. 325 projects building agent payments — zero building governance. @colaboratorio @solana #SolanaFrontier"
- [ ] Build in public: share architecture diagram from README on Twitter
