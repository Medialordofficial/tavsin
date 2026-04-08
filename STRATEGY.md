# TAVSIN — COLOSSEUM FRONTIER HACKATHON: STRATEGIC RESEARCH & BATTLE PLAN

> **CONFIDENTIAL** — Internal strategy document
> Last updated: April 8, 2026 (v3 — Renamed Aegis → Tavsin, smart wallet architecture, full gap analysis)

---

## 0. VERSION HISTORY

| Version | Date | Changes |
|---|---|---|
| v1 | Apr 8 | Initial "Aegis trust layer" concept |
| v2 | Apr 8 | Copilot research → pivoted to "spending policy engine," named competitors |
| **v3** | **Apr 8** | **Renamed to Tavsin. Smart wallet architecture (not proxy/middleware). Added: website plan, brand identity, social strategy, wow features, futuristic roadmap, infrastructure plan, production quality standards** |

### What Changed in v3

1. **Name: Aegis → Tavsin** (AegisProtocol was taken)
2. **Architecture: "policy engine middleware" → "policy-enforced smart wallet"** — Tavsin IS the wallet, not a layer in front of one. Agent funds live in Tavsin PDAs. Program signs with PDA authority after policy check.
3. **Added everything we were missing** — website, branding, social presence, wow features, hosting plan, agent-to-agent commerce, credit rails, pitch video production, x402/MCP demo integration

---

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
- Exclusive founder network, 1:1 mentorship, AI credits
- IRL support at Colosseum's San Francisco office
- **Private Demo Day** pitching to leading crypto VCs

### Key Rules
- No tracks, no bounties — judged purely on impact, viability, execution
- Must integrate with Solana
- Must be a new project
- Working demo on devnet expected
- Submission: **pitch video (< 3 min)**, GitHub repo, product description
- Weekly updates required

### Judging Criteria (from "How to Win" guide)
1. **Full-time founder intent** — building this as a real startup
2. **Viable business model** — product with revenue path
3. **Working demo** — functional on Solana devnet
4. **Product presentation** — Loom video under 3 min
5. **Market opportunity** — enabling new markets or improving existing ones
6. **Team quality** — technical + non-technical mix, ideally 3+ members

### Notable Judges
- **Anatoly Yakovenko** — Cofounder, Solana
- **Lily Liu** — President, Solana Foundation
- **Clay Robbins & Matty Taylor** — Cofounders, Colosseum
- Judges from: Phantom, Squads Labs, Raydium, Drift, Arcium, Metaplex, Reflect, Axiom, EasyA, Ellipsis Labs, Anza

### Build Path Alignment
- **Agents + Tokenization** → Tavsin = AI agent wallet infrastructure
- **Treasury + Security** → Tavsin = treasury-grade policy enforcement
- **DeFi + Stablecoins** → Tavsin = DeFi agent spending controls

**Tavsin spans all three.** Multi-category projects catch more judge attention.

---

## 2. COMPETITOR LANDSCAPE (COPILOT-VALIDATED)

### What Colosseum Copilot Revealed

Source: docs.colosseum.com/copilot/examples/ai-agent-payments

**Cluster stats:**
- "Solana AI Agent Infrastructure" cluster: **crowdedness 325**
- x402 is the converging standard for agent payments
- MCPay won 1st Place Stablecoins (Cypherpunk) + C4 Accelerator
- Latinum won 1st Place AI (Breakout) at $25K

**What exists (payment rails):**
- MCPay — x402 MCP tool monetization (1 person team)
- Latinum — Payment middleware + MCP-compatible wallet
- Corbits.dev — x402 API payment proxy
- Agent-Cred — Hotkey/coldkey dual-key for agent wallets
- AEP — Service discovery → price negotiation → escrow → settlement

**What does NOT exist (Copilot's own words):**
> "No project has built spending policy engines"
> "No project has built credit rails for agents"
> "Security model for agent wallets is unsolved"
> "MCPay and Latinum delegate budget management to developers"

**Copilot's top opportunity:** "Brex for AI Agents"

**THIS IS EXACTLY TAVSIN.**

### Updated Competitor Map

| Layer | What exists | Gap (Tavsin) |
|---|---|---|
| **Payment protocol** | x402 (Coinbase, 2025) | Protocol doesn't control spending |
| **Payment rails** | MCPay, Latinum, Corbits | Rails don't enforce budgets |
| **Wallet creation** | Turnkey (TEE-based) | Creating wallet ≠ governing it |
| **Key separation** | Agent-Cred (hotkey/coldkey) | Key architecture ≠ spending rules |
| **Scam detection** | Blowfish (passive warnings) | Warnings to humans ≠ enforcement for agents |
| **Multi-party approval** | Squads (human multisig) | Human consensus ≠ automated policy |
| **Smart wallet for agents** | **NOTHING** | **← TAVSIN** |

### Why Tavsin Wins This Position

1. **Copilot literally calls it the #1 gap** — data, not guessing
2. **325-project cluster, zero competitors in our layer**
3. **MCPay + Latinum validate demand** — funded, lack what we build
4. **x402 adoption creates urgency** — more agents transacting = more need for governance
5. **Smart wallet is the moat** — agent funds live inside the program, not bypassable

---

## 3. RISK ANALYSIS & FAILURE POINTS (v3)

### Risk 1: "Why Not Just Use a Regular Wallet + App Logic?"
**Severity: CRITICAL** → **RESOLVED by smart wallet architecture**
- App-level limits are bypassable — agent has the private key and can call any program directly
- Tavsin: agent NEVER has the key. Funds live in a PDA. Only the Tavsin program can sign.
- This is the Squads argument: "Why not just share a private key?" → Because multisig enforces N-of-M at the program level. Same logic, but for agent policy.

### Risk 2: "Looks Like Blowfish / Squads"
**Severity: MEDIUM**
- Blowfish: passive warnings for humans → Tavsin: active enforcement, agent has no keys
- Squads: human multisig → Tavsin: automated policy for non-human agents
- Demo MUST show the difference live

### Risk 3: "Too Narrow / Not a Business"
**Severity: MEDIUM**
- 325 projects need this. MCPay/Latinum are funded and lack it.
- Revenue: 0.05-0.1% per policy-checked tx + SaaS dashboard
- Expansion: credit rails (Copilot's #2 opportunity), insurance, agent reputation

### Risk 4: Another Team Builds the Same Thing
**Severity: LOW**
- Nobody has across 5,400+ submissions
- Speed advantage: we start with exact thesis already framed

### Risk 5: Team Size
**Severity: HIGH if solo**
- Ideal: 1 Anchor/Rust dev + 1 TypeScript/SDK dev + 1 frontend/pitch
- Recruit via Colosseum Discord + Cofounder Directory THIS WEEK

### Risk 6: Weak Demo / Presentation
**Severity: HIGH**
- See section 12 below for production-quality pitch video plan

---

## 4. TECHNICAL ARCHITECTURE (v3 — Smart Wallet)

### Why Smart Wallet, Not Middleware

| Approach | Problem |
|---|---|
| **CPI middleware** (v2) | Requires target programs (Jupiter, etc.) to call Tavsin — they won't for a hackathon project |
| **Off-chain middleware** (v1) | Agent has private key, can bypass entirely |
| **Smart wallet** (v3) ✅ | Agent's funds ARE inside the program. To spend, agent MUST call Tavsin. Tavsin signs and CPI-invokes target. Unbypassable. |

This is identical to how **Squads Protocol** works — a multisig wallet where the program controls signing authority. Tavsin replaces human N-of-M consensus with automated policy evaluation.

### On-Chain Program (Anchor/Rust)

```
tavsin-program/
├── instructions/
│   ├── create_wallet.rs      — Owner creates smart wallet PDA + policy
│   ├── fund_wallet.rs        — Owner deposits SOL/tokens into wallet PDA
│   ├── execute.rs            — Agent requests tx → policy check → PDA signs → CPI to target
│   ├── update_policy.rs      — Owner modifies spending rules
│   ├── freeze_wallet.rs      — Owner emergency freeze (kill switch)
│   └── withdraw.rs           — Owner reclaims funds from wallet PDA
├── state/
│   ├── wallet.rs             — Wallet PDA: owner, agent, balance pointer, policy, frozen flag
│   ├── policy.rs             — Policy: per-tx limit, daily budget, program allowlist, time window
│   ├── spend_tracker.rs      — Rolling spend counter per budget period
│   └── audit_entry.rs        — On-chain log: approved/denied, amount, target, timestamp, reason
└── errors.rs                 — ExceedsLimit, ProgramNotAllowed, BudgetExhausted, WalletFrozen, Unauthorized
```

### Execution Flow

```
1. Owner creates Tavsin wallet:
   → create_wallet(owner, agent_pubkey, policy_rules)
   → PDA created: seeds = [owner, agent_pubkey, "tavsin-wallet"]
   → Policy stored alongside wallet

2. Owner funds the wallet:
   → fund_wallet(wallet_pda, amount)
   → SOL/tokens transferred INTO the wallet PDA

3. Agent wants to spend:
   → Agent calls: tavsin::execute(wallet_pda, target_program, instruction_data, amount)
   → Tavsin program:
      a. Verify: caller == wallet.agent? (unauthorized otherwise)
      b. Verify: wallet.frozen == false?
      c. Check: amount ≤ policy.per_tx_limit?
      d. Check: spend_tracker.cumulative + amount ≤ policy.daily_budget?
      e. Check: target_program ∈ policy.allowed_programs?
      f. Check: Clock::get().unix_timestamp within policy.time_window?
      g. If ALL pass → sign with PDA authority → CPI invoke target program
      h. If ANY fail → return Err, log audit entry with denial reason
      i. On success → update spend_tracker, log audit entry

4. Owner monitors:
   → Dashboard reads audit PDAs via Helius
   → Real-time spend vs. budget charts
   → Alert on anomalies / denials
   → /freeze command via Telegram bot
```

### Key Design Decisions

1. **PDA-as-wallet** — Agent funds live in the PDA. `seeds = [owner, agent, "tavsin-wallet"]`. The Tavsin program is the authority.
2. **Agent signs to prove identity, not to move funds** — Agent keypair proves "I am the authorized agent" but the actual token transfer is signed by the PDA authority (the program).
3. **Budget periods via Clock sysvar** — No off-chain cron. The program checks `Clock::get()` and compares against the spend tracker's `period_start` timestamp.
4. **Audit PDAs** — Every decision (approve/deny) writes a PDA. On-chain, immutable, queryable by Helius.
5. **Kill switch** — `freeze_wallet` sets a flag. `execute` checks it first. Instant, on-chain, no off-chain dependency.

### Tech Stack

| Component | Technology | Why |
|---|---|---|
| Smart wallet program | Anchor (Rust) | Standard for Solana, judges expect it |
| SDK | TypeScript (`@tavsin/sdk`) | Wraps all instructions, policy CRUD, audit queries |
| Dashboard | Next.js | Fleet management, audit viewer, policy templates |
| Landing page | Next.js (same app, `/` route) | Marketing + docs for judges |
| Hosting | **Vercel** | Free, native Next.js support, instant deploys |
| Domain | TBD (see section 9) | ~$10/year |
| RPC | **Helius** | 50% hackathon discount, DAS API for PDA queries |
| Testing | Bankrun + anchor test | Fast local testing |
| AI Agent Demo | TypeScript + OpenAI | Demo agent that proposes swaps through Tavsin |
| Notifications | Telegram bot (webhook) | Kill switch + alerts for owners |

---

## 5. SPRINT PLAN (v3 — 5 Weeks)

| Week | Focus | Deliverable | Weekly Update |
|---|---|---|---|
| **Week 1** (Apr 6-12) | Anchor program + smart wallet | `create_wallet` + `execute` + `freeze_wallet` on localnet. Brand + domain + social. | "Tavsin smart wallet live on devnet. Agent blocked on first spend limit violation." |
| **Week 2** (Apr 13-19) | Policy engine + spend tracking | Budget periods, program allowlist, audit log PDAs, full test suite | "Policy engine enforcing 6 rule types. Audit log queryable on-chain. [Video]" |
| **Week 3** (Apr 20-26) | TypeScript SDK + agent demo + x402 | `@tavsin/sdk`, demo agent swapping on Jupiter, x402/MCP tool payment demo | "End-to-end: AI agent → Tavsin wallet → Jupiter swap. x402 tool payment governed. [Video]" |
| **Week 4** (Apr 27-May 3) | Dashboard + landing page + Telegram bot | Fleet view, audit viewer, kill switch, policy templates, marketing page | "Dashboard live. Fleet of 10 agents managed from one screen. Kill switch in 2 seconds." |
| **Week 5** (May 4-11) | Polish + pitch video + submission | Bug fixes, production video, README cleanup, submission on arena | "Submitted. Here's our pitch and demo." |

### Week 1 Detailed (Day-by-Day)

| Day | Task |
|---|---|
| **Day 1 (Apr 8)** | `anchor init tavsin`, define Wallet + Policy + SpendTracker state structs. Buy domain. Create @TavsinProtocol on X. |
| **Day 2** | Implement `create_wallet` instruction (owner + agent + policy → PDA). Write first test. |
| **Day 3** | Implement `execute` instruction (agent calls → policy check → PDA signs → CPI to mock program). |
| **Day 4** | Implement `freeze_wallet` + `withdraw` + `update_policy`. Full instruction set. |
| **Day 5** | Test suite: wallet creation, valid tx, blocked tx (each rule type), freeze, withdraw. |
| **Day 6** | Deploy to devnet. Verify on Solana Explorer. First public tweet with program address. |
| **Day 7** | Buffer / catchup. First weekly update on arena. Logo + color palette finalized. |

---

## 6. INFRASTRUCTURE & HOSTING PLAN

### Where Everything Lives

| What | Where | Cost | Notes |
|---|---|---|---|
| **Solana program** | Devnet (hackathon) → Mainnet (post) | Free (devnet) | Program ID in README |
| **Dashboard + Landing page** | **Vercel** | Free tier | Next.js native, instant deploys from GitHub |
| **Domain** | Namecheap or Cloudflare | ~$10/year | Options: `tavsin.xyz`, `tavsin.sh`, `usetavsin.com`, `tavsinprotocol.com` |
| **RPC** | **Helius** | Free → 50% hackathon discount | Built-in DAS API for PDA queries |
| **Pitch video** | Loom or YouTube (unlisted) | Free | < 3 min, link in submission |
| **npm package** | npm registry (`@tavsin/sdk`) | Free | Published for devs to install |
| **Source code** | GitHub (Medialordofficial/tavsin) | Free | Public during hackathon for judge access |
| **Telegram bot** | Self-hosted on Vercel serverless function | Free | Webhook-based, no server needed |
| **Docs** | In-app (`/docs` route) or README | Free | Keep it simple for hackathon |

**Total cost: ~$10 for a domain.** Everything else is free tier.

### Vercel Deployment Flow

```
GitHub push → Vercel auto-deploys → Live at tavsin.xyz (or chosen domain)
```

The Next.js app serves both:
- `/` → Landing page (marketing, for judges visiting the link)
- `/dashboard` → Fleet management app (policy creation, audit viewer, kill switch)
- `/docs` → Quick-start guide for developers

---

## 7. BRAND & VISUAL IDENTITY

### Name: Tavsin
- Unique, not taken
- Short, memorable, pronounceable
- No existing crypto/tech associations

### Visual Direction

| Element | Choice | Rationale |
|---|---|---|
| **Logo** | Shield icon (Tavsin means protection) | Clean, recognizable at small sizes |
| **Primary color** | Deep indigo (#3730A3) | Trust, security, premium feel |
| **Accent color** | Amber/gold (#F59E0B) | Warmth, value, stands out on dark bg |
| **Background** | Near-black (#0F172A) | Crypto-native dark mode |
| **Font** | Inter or Space Grotesk | Modern, clean, widely available |
| **Style** | Minimal, dark mode, sharp edges | Matches Solana ecosystem aesthetic (Phantom, Jupiter, etc.) |

### Brand Assets Needed

- [ ] Logo (SVG + PNG, light/dark variants)
- [ ] OG image (1200x630) for Twitter/social sharing
- [ ] Favicon
- [ ] Color-consistent dashboard UI
- [ ] README header image (optional, but polished)

**Use Figma or a quick AI design tool. Don't spend more than 2-3 hours on this.**

---

## 8. SOCIAL & "BUILD IN PUBLIC" STRATEGY

### Why This Matters

- Colosseum explicitly recommends building in public
- MCPay's creator (@microchipgnu) live-tweeted their entire build → won accelerator
- Judges check Twitter/X activity
- Community engagement = "full-time founder intent" signal

### Accounts to Create

- [ ] **@TavsinProtocol** on X/Twitter
- [ ] Colosseum Discord presence (introduce yourself, share progress)

### Posting Schedule

| Day | Post |
|---|---|
| **Day 1** | "Building the smart wallet for AI agents on Solana. 325 projects building agent payments — zero building wallet-level governance. Let's fix that. @colosseum_ @solana #SolanaFrontier" |
| **Day 3** | Architecture diagram from README. "Here's how Tavsin works: agent funds → PDA → policy check → sign or block. No keys for agents. No middleware to bypass." |
| **Day 6** | Devnet deployment. "Tavsin smart wallet deployed to devnet. First agent transaction blocked for exceeding spend limit. It works. 🛡️" + Solana Explorer screenshot |
| **Week 2** | 15-second demo clip. "Agent tries to swap 200 USDC. Policy says max 50. Wallet says no." |
| **Week 3** | SDK announcement. "npm install @tavsin/sdk — 3 lines of code to give your AI agent a governed wallet." |
| **Week 4** | Dashboard preview. "Managing 10 AI agents from one screen. Per-agent budgets, audit logs, kill switch." |
| **Week 5** | Pitch video teaser. Full submission announcement. |

### Engagement Targets

- Tag @colosseum_, @solaboratory, @heaborade, relevant judges
- Reply to threads about AI agents + Solana
- Share in Colosseum Discord #showcase channel
- DM MCPay/Latinum creators — "We're building the governance layer for your payment rails"

---

## 9. DOMAIN OPTIONS

Check availability and register one ASAP:

| Domain | Vibe |
|---|---|
| `tavsin.xyz` | Clean, crypto-native |
| `tavsin.sh` | Developer-friendly, short |
| `usetavsin.com` | Product-focused |
| `tavsinprotocol.com` | Protocol positioning |
| `tavsin.dev` | Developer tool positioning |
| `tavsin.io` | Classic startup domain |

**Budget: $10-15.** Register on Cloudflare (cheapest renewals) or Namecheap.

---

## 10. "WOW FACTOR" FEATURES

These are the features that make judges REMEMBER Tavsin. Not all are needed — pick 2-3 for the demo.

| Feature | What it does | Effort | Demo impact |
|---|---|---|---|
| **Telegram kill switch** | Owner types `/freeze agent-3` → Tavsin program freezes the wallet PDA in ~2 seconds | 1-2 days (serverless function + Telegram bot API) | **HUGE** — live demo of instant freeze gets audible reaction |
| **Real-time spend dashboard** | Live-updating chart: agent spend vs. budget, WebSocket via Helius | Built into Week 4 dashboard | High — visual impact, judges see the budget bar move |
| **Agent reputation score** | On-chain compliance counter. Agents that stay within policy build reputation (PDA counter: total_approved / total_denied) | Low effort, 1 extra field | Medium — futuristic angle |
| **Multi-agent fleet view** | One screen: 10 agents, their wallets, budgets, live status, spend velocity | Dashboard feature | **HUGE** — this is the "enterprise" signal judges look for |
| **Policy templates** | "Conservative DeFi", "MCP Tool Payments", "High-Frequency Trading" — one-click setup | JSON presets, trivial | Medium — UX polish signal |
| **x402 tool payment demo** | Agent paying for MCP tool call via x402 → Tavsin enforces per-vendor cap | Needs x402 integration | High — shows ecosystem fit, names MCPay/Latinum |
| **Anomaly alert** | Dashboard pops notification when agent's spend velocity exceeds normal pattern | Simple threshold check | Medium — shows sophistication |

### Recommended for Demo: Telegram kill switch + Fleet view + x402 tool payment

---

## 11. FUTURISTIC ROADMAP (Post-Hackathon Vision)

This is what makes judges think "this is a startup, not a weekend project."

### Phase 1: Smart Wallet (Hackathon MVP)
- Policy-enforced smart wallets for agents
- Per-agent budgets, vendor limits, program allowlists
- Fleet dashboard + audit log
- TypeScript SDK

### Phase 2: Agent Credit Rails
- **Copilot's #2 underexplored opportunity**
- Agents with good compliance history get **higher spending limits automatically**
- On-chain credit scoring for non-humans: `reputation = total_approved / total_transactions`
- Credit facility: agents can spend slightly above their funded balance if reputation is high (protocol-backed credit line)

### Phase 3: Agent-to-Agent Commerce
- Agent A can pay Agent B up to X USDC — governed by Tavsin policies on both sides
- Creates a **mesh of governed spending relationships**
- This is where commerce goes: agents hiring agents, agents paying agents for services
- Tavsin becomes the settlement + governance layer for the agent economy

### Phase 4: Insurance Layer
- Policy-compliant agents qualify for lower insurance premiums
- Partner with insurance protocols or build a mini insurance vault
- "If your agent uses Tavsin, your coverage costs 50% less" — instant adoption incentive

### Phase 5: Cross-Agent Analytics
- Aggregate spend data across all Tavsin-governed agents
- "What are AI agents spending money on?" — only Tavsin would know
- Anonymized analytics product for DeFi protocols wanting agent-user insights

### Phase 6: Composability with Squads
- Team-level governance: Squads for human multisig decisions, Tavsin for agent policy
- Company treasury → Squads multisig → approves Tavsin wallet budget → agents spend within Tavsin policy
- Full stack: human governance → agent governance → execution

### Phase 7: Multi-Chain Expansion
- Solana first (hackathon + launch). EVM later.
- Same model: smart wallet PDA → policy engine → signed execution
- Cross-chain agent wallets with unified dashboard

---

## 12. PITCH VIDEO PRODUCTION PLAN

### Quality Standard
Winners don't submit raw Loom recordings. Plan for:

| Element | Standard |
|---|---|
| **Video** | Clean screen recording + face cam (optional) |
| **Audio** | External mic or quiet room, no echo |
| **Intro** | 5-second motion graphic with Tavsin logo (After Effects, Canva, or CapCut) |
| **Demo** | Split-screen: terminal (tx happening) + Solana Explorer (on-chain proof) |
| **Pacing** | Under 2:30. Cut ruthlessly. Every second must deliver value. |
| **Closing** | Tavsin logo + website URL + GitHub link |

### Recording Setup
1. **Screen capture:** OBS (free) with 1080p, clean desktop (hide all non-demo windows)
2. **Terminal:** Use a clean terminal theme (dark bg, readable font, no clutter)
3. **Explorer:** Solana Explorer or SolanaFM open to show the tx happening on-chain
4. **Dashboard:** Show the fleet view reacting in real-time to the agent's transactions
5. **Telegram:** Show the kill switch in action on a phone (picture-in-picture)

### Script Timing (Align with PITCH.md)
| Section | Duration |
|---|---|
| Hook | 8 sec |
| The Gap | 20 sec |
| Tavsin | 20 sec |
| Live Demo | 40 sec |
| Why Now | 15 sec |
| Business | 10 sec |
| Close | 7 sec |
| **Total** | **~2 min** |

---

## 13. WHAT JUDGES LOOK AT IN GITHUB REPOS

- **Code quality** — Clean Anchor code, idiomatic Rust, proper error handling
- **README** — Clear "smart wallet for agents" framing (done)
- **Commit history** — Regular commits throughout 5 weeks (NOT a last-day dump)
- **Working demo** — Program deployed to devnet with verifiable address
- **Documentation** — Setup instructions that judges can follow to test
- **Architecture** — Clear program structure, SDK separate from frontend

### Target Repo Structure
```
tavsin/
├── programs/tavsin/          — Anchor program (Rust)
│   ├── src/
│   │   ├── instructions/     — create_wallet, execute, freeze, withdraw, update_policy
│   │   ├── state/            — wallet, policy, spend_tracker, audit_entry
│   │   └── lib.rs
│   └── Cargo.toml
├── sdk/                      — @tavsin/sdk TypeScript package
├── app/                      — Next.js (landing page + dashboard)
├── bot/                      — Telegram kill switch bot
├── demo/                     — Demo agent script (judges run this)
├── tests/                    — Anchor tests
├── README.md                 — Judge-facing
├── PITCH.md                  — Pitch script + summaries
└── STRATEGY.md               — This file (internal, consider making private)
```

---

## 14. NARRATIVE HOOKS FOR SPECIFIC JUDGES

| Judge | Hook |
|---|---|
| **Anatoly Yakovenko** (Solana) | "Tavsin makes Solana the default chain for agent commerce — smart wallet with on-chain policy that EVM can't replicate at this speed/cost" |
| **Lily Liu** (Solana Foundation) | "325 agent projects on Solana, zero smart wallets for agents. Tavsin is the missing wallet infrastructure." |
| **Squads Labs judge** | "Squads = multisig for humans. Tavsin = policy wallet for agents. Same architecture, different use case. We integrate, not compete." |
| **Phantom judge** | "Every Phantom user who delegates to an AI agent needs a Tavsin wallet. Phantom for humans, Tavsin for their agents." |
| **Drift / Raydium judges** | "DeFi protocols want agent users but fear uncontrolled spending. Tavsin wallets enforce per-protocol limits." |
| **Clay Robbins** (Colosseum) | "Full-time founder intent. Copilot confirmed the gap, we're filling it. This is our startup." |

---

## 15. LOOPHOLES TABLE (CUMULATIVE)

| Loophole | Why it would lose | Fix |
|---|---|---|
| "Trust layer" framing | Too abstract | "Smart wallet for AI agents" — concrete, tangible |
| "Policy engine middleware" | Jupiter/Raydium won't add CPI calls for a hackathon project | Smart wallet: Tavsin IS the wallet, agent calls our program, we CPI to target |
| AegisProtocol name taken | Can't claim social handles | Renamed to **Tavsin** |
| No website | Judges click links, find nothing | Landing page on Vercel (free) |
| No social presence | Looks like you started yesterday | @TavsinProtocol on X, build in public from Day 1 |
| No brand/visual identity | Looks unpolished vs. winners | Logo, color palette, consistent dark-mode UI |
| No team | Judges weight team quality heavily | Recruit via Colosseum Discord THIS WEEK |
| No x402/MCP demo | Name-dropping without showing | Demo: agent pays for MCP tool call via x402, Tavsin governs the spend |
| No "wow factor" | Forgettable among 500+ submissions | Telegram kill switch, fleet dashboard, real-time spend charts |
| CPI architecture impossible | Target programs won't call our program | Smart wallet model: we control the signing authority |
| Zero lines of code | Hackathon started Apr 6, we have 0 code | Code starts NOW. Anchor init today. |
| No futuristic vision | Looks like a feature, not a company | Credit rails, agent-to-agent commerce, insurance layer (section 11) |
| Pitch video = raw Loom | Looks amateur | Intro graphic, split-screen demo, clean audio (section 12) |

---

## 16. IMMEDIATE ACTION ITEMS (NEXT 48 HOURS)

### TODAY (April 8)

- [ ] `anchor init tavsin` — start the project
- [ ] Define `Wallet` + `Policy` + `SpendTracker` state structs in Rust
- [ ] Register domain (check `tavsin.xyz`, `tavsin.sh`, etc.)
- [ ] Create **@TavsinProtocol** on X/Twitter
- [ ] First tweet: "Building the smart wallet for AI agents on Solana. 325 projects building agent payments — zero building wallet governance. @colosseum_ @solana #SolanaFrontier"
- [ ] Join Colosseum Discord, introduce yourself
- [ ] Register on arena.colosseum.org for Frontier hackathon
- [ ] Rename GitHub repo from `aegis` to `tavsin`

### TOMORROW (April 9)

- [ ] Implement `create_wallet` instruction
- [ ] Implement `execute` instruction (policy check → PDA sign → CPI)
- [ ] Write first tests: wallet creation, valid tx, blocked tx
- [ ] Post in Colosseum Discord looking for cofounders
- [ ] Run idea through Colosseum Copilot (live version at arena)
- [ ] Set up Helius RPC (50% off hackathon deal)

### BY END OF WEEK 1 (April 12)

- [ ] Full instruction set: create_wallet, execute, freeze, withdraw, update_policy
- [ ] Test suite covering all 6 policy rule types
- [ ] Deployed to devnet with verifiable program address
- [ ] Logo + color palette finalized
- [ ] Landing page scaffold on Vercel
- [ ] First weekly update submitted on arena
- [ ] 3+ tweets with progress
