# AEGIS — COLOSSEUM FRONTIER HACKATHON: STRATEGIC RESEARCH & BATTLE PLAN

> **CONFIDENTIAL** — Internal strategy document
> Last updated: April 8, 2026

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

## 2. COMPETITOR LANDSCAPE ANALYSIS

### Direct Competitors (Policy/Security for AI Agents On-Chain)

**VERDICT: NO DIRECT COMPETITOR EXISTS ON SOLANA.**

No project currently offers a policy-driven execution engine specifically for AI agents on Solana. Here's the landscape:

#### Tier 1: Adjacent Infrastructure (Established Companies)

| Project | What They Do | Why They're NOT Aegis |
|---|---|---|
| **Blowfish** | Transaction simulation / scam detection for wallets (Phantom uses it) | **Passive warning system** — shows risk to humans. Does NOT enforce policies, does NOT work with AI agents, and does NOT provide a decision engine. It's a wallet security API, not an agent trust layer. |
| **Turnkey** | Wallet infrastructure — creates wallets for AI agents using TEEs, has a "policy engine" | **Wallet infra, not a trust layer.** Their policies are about key access control (who can sign), NOT about transaction-level risk analysis or spend limits for autonomous AI. They're the plumbing; Aegis is the governance layer on top. |
| **Fireblocks** | Enterprise digital asset infrastructure — custody, treasury, policies | **Enterprise-only, EVM-focused, $100K+ pricing.** Their policy engine is for institutional treasury ops, not for consumer AI agents. Not on Solana. |
| **Squads Protocol** | Multisig + smart accounts on Solana | **Multi-signature approval, not AI agent policy.** Squads is about multi-party human approval. Aegis is about automated policy enforcement for AI agents. Complementary, not competitive. |

#### Tier 2: Agent Hackathon Honorable Mentions (Feb 2026)

| Project | What They Did | Status |
|---|---|---|
| **Sentry Agent Economy** | Mentioned as honorable mention in agent hackathon | No details available — likely concept-stage |
| **StableGuard** | Honorable mention | No details available |
| **SolShield** | Honorable mention | No details available |
| **AgentOS** (2nd place, $30K) | Agent operating system | Broader AI agent platform, not security-focused |

**Critical insight:** None of the Agent Hackathon winners focused on the trust/security layer. The top 3 were: DegenDome (betting), AgentOS (general agent platform), BlockHelix (unknown). The security-adjacent honorable mentions (Sentry, StableGuard, SolShield) didn't win prizes and likely haven't continued development.

#### Tier 3: Broader AI Agent Ecosystem

| Project | Relevance |
|---|---|
| **Lit Protocol** | Programmable key pairs / PKPs — decentralized key management. Different layer (key infra, not policy) |
| **Privy** | Embedded wallets, auth — a hackathon sponsor, not a competitor |
| **Arcium** | Confidential computing on Solana — different problem (privacy, not policy) |

### Uniqueness Assessment: ✅ CONFIRMED UNIQUE

**What makes Aegis genuinely novel:**
1. **No one is building "policy-as-infrastructure" for on-chain AI agents on Solana**
2. Blowfish = passive risk warnings for humans
3. Turnkey = wallet key management
4. Squads = multi-party human approval
5. Fireblocks = enterprise custody

**Aegis' unique position:** Active, real-time policy enforcement + risk simulation as a middleware layer between AI agents and the blockchain, on Solana.

---

## 3. RISK ANALYSIS & FAILURE POINTS

### Risk 1: "Too Conceptual" — Judges Want Working Demos
**Severity: HIGH**
**Mitigation:**
- Build a functional demo on Solana devnet in the first 3 weeks
- Show a live transaction being proposed by an AI agent, evaluated against a policy, and either executed or blocked
- The demo doesn't need to be production-ready — it needs to provoke an "aha moment"
- Prioritize: Policy Engine + one AI agent flow + visual dashboard over breadth

### Risk 2: "Just Another Multisig/Wallet Feature"
**Severity: MEDIUM**
**Mitigation:**
- Clearly differentiate from Squads (multisig = human consensus; Aegis = automated policy enforcement)
- Clearly differentiate from Blowfish (passive warnings vs. active enforcement)
- Frame Aegis as **infrastructure**, not a wallet feature
- Position: "This is the missing layer that wallets and agent platforms will integrate"

### Risk 3: Scope Creep — Building Too Much
**Severity: MEDIUM**
**Mitigation:**
- Follow the hackathon guide: "Prioritize features that create an amazing working demo"
- MVP scope: Policy definition → AI intent parsing → Risk check → Execute/Block → Audit log
- Do NOT try to build multi-chain, full dashboard, or complex risk simulation in 5 weeks
- Nail one flow perfectly: User sets policy → AI agent tries to send tokens → Aegis approves or blocks

### Risk 4: Team Size / Capacity
**Severity: HIGH if solo**
**Mitigation:**
- Average winning team is 3+ members
- Use Colosseum's Cofounder Directory to find teammates
- Ideal team: 1 Solana smart contract dev + 1 backend/AI dev + 1 frontend/design
- If solo: focus on smart contract + minimal CLI demo, skip fancy frontend

### Risk 5: Not "Building in the Open"
**Severity: MEDIUM**
**Mitigation:**
- Colosseum explicitly recommends building in public
- Create a Twitter/X account for Aegis immediately
- Share weekly progress updates publicly
- Find beta testers through crypto Twitter
- This also helps with weekly update submissions

### Risk 6: Weak Presentation / Pitch Video
**Severity: HIGH**
**Mitigation:**
- Judges review hundreds of submissions — presentation is make-or-break
- Use Loom (recommended by Colosseum)
- Follow the pitch structure: Team → Problem → Solution → Market → Demo → Why Now
- Keep under 3 minutes, be concise
- Show the working demo, don't just talk about it
- Use the pitch script from PITCH.md as foundation

### Risk 7: Similar Project Submitted by Another Team
**Severity: LOW-MEDIUM**
**Mitigation:**
- Use Colosseum Copilot to check against 5,400+ past submissions (available at arena.colosseum.org/copilot)
- Even if similar ideas exist, judges value execution and differentiation
- Colosseum guide: "Don't be afraid to build products that have been attempted before. Timing and execution matter."
- Our edge: clear positioning, strong narrative, working demo

---

## 4. STRATEGIC RECOMMENDATIONS

### 4.1 Positioning Strategy
Frame Aegis NOT as a security tool, but as **infrastructure for autonomous finance**:
> "We're not building a wallet feature. We're building the trust layer that makes autonomous on-chain finance possible."

This resonates because:
- Judges want **ambitious, long-term visions** (from the guide)
- "Wildly ambitious products" is explicitly encouraged
- Infrastructure plays win accelerators (see: Jito, Helius, Switchboard, Squads — all infra)

### 4.2 Build Path Alignment
Target the **"Agents + Tokenization"** and **"Treasury + Security"** build paths simultaneously. This shows cross-cutting relevance.

### 4.3 Sprint Plan (5 Weeks)

| Week | Focus | Deliverable |
|---|---|---|
| **Week 1** (Apr 6-12) | Architecture + Solana program skeleton | Policy data structures on-chain, basic Anchor program |
| **Week 2** (Apr 13-19) | Core policy engine | On-chain policy evaluation, spend limit checks, contract allowlisting |
| **Week 3** (Apr 20-26) | Agent SDK + integration | Simple AI agent that proposes txs → Aegis evaluates → execute/block |
| **Week 4** (Apr 27-May 3) | Risk simulation + dashboard | Basic risk scoring, minimal web dashboard showing tx audit log |
| **Week 5** (May 4-11) | Polish, testing, pitch video | Bug fixes, demo recording, submission preparation |

### 4.4 MVP Feature Priority (What to Ship)

**MUST HAVE (Core demo):**
1. On-chain policy program (Anchor/Solana) — spending limits, contract allowlist
2. Policy evaluation logic — check tx against user-defined rules
3. Simple AI agent integration — natural language → tx proposal → policy check
4. Execute or Block decision
5. On-chain audit log of all decisions

**NICE TO HAVE (If time permits):**
6. Web dashboard showing policies + audit trail
7. Risk scoring (contract verification status)
8. Multiple policy templates

**CUT (Save for post-hackathon):**
- Multi-chain support
- Complex risk simulation
- Advanced NLP intent parsing
- Mobile support

### 4.5 Tech Stack Recommendation

| Component | Technology |
|---|---|
| Smart Contracts | **Anchor** (Solana framework) |
| Backend/Agent | **TypeScript + @solana/web3.js** |
| AI Integration | **OpenAI API** or similar for intent parsing |
| Frontend | **Next.js** (minimal dashboard) |
| RPC | **Helius** (50% off for hackathon, see resources page) |
| Demo | **Solana Devnet** |

### 4.6 Narrative Hooks for Judges

These specific angles will resonate with the Frontier judges:

1. **For Anatoly Yakovenko / Lily Liu:** "Aegis makes Solana the safest chain for AI agents — it's native infrastructure that brings institutional-grade safety to consumer AI wallets."

2. **For Squads/Phantom judges:** "We complement Squads (multi-party security) and Phantom (user-facing wallet). Aegis is the policy middleware that wallets and protocols will integrate."

3. **For DeFi judges (Drift, Raydium):** "Every DeFi protocol that wants AI-agent users needs Aegis to ensure agents don't drain liquidity or execute toxic trades."

4. **Business model angle:** "B2B SaaS — wallets and agent platforms pay for Aegis policy-engine-as-a-service. Or protocol-level fee on every policy-checked transaction."

### 4.7 Colosseum Copilot
**Use it immediately.** Available at arena.colosseum.org/copilot. It lets you pressure-test your idea against 5,400+ past hackathon submissions. Run Aegis through it to:
- Confirm no direct overlap with past winners
- Get AI feedback on positioning
- Find angles you might be missing

---

## 5. WHAT JUDGES LOOK AT IN GITHUB REPOS

From Colosseum's FAQ and guide:
- **Code quality** — Clean, well-organized code
- **README** — Clear project description (we already have a strong one)
- **Commit history** — Shows consistent work throughout the hackathon (don't commit everything at once)
- **Working demo** — Code actually runs on devnet
- **Documentation** — How to set up and test
- **Architecture** — Clear separation of concerns

**Action items:**
- Commit code regularly throughout the 5 weeks
- Include setup instructions that judges can follow
- Have a `/demo` or `/examples` folder showing usage
- Include the devnet program address in README

---

## 6. WEEKLY UPDATE STRATEGY

Colosseum requires weekly updates. Make them count:

**Week 1:** "Defined architecture. Policy program skeleton deployed to devnet. Here's our on-chain policy data structure."
**Week 2:** "Core policy engine working. Can enforce spending limits and contract allowlists on devnet. [Video demo]"
**Week 3:** "AI agent integrated. Natural language → transaction proposal → policy check → execute/block. End-to-end flow working."
**Week 4:** "Risk scoring added. Dashboard live. Audit trail visible. Seeking beta testers."
**Week 5:** "Final polish. Pitch video recorded. Full demo ready."

---

## 7. IMMEDIATE ACTION ITEMS (NEXT 48 HOURS)

- [ ] Register on arena.colosseum.org for Frontier hackathon
- [ ] Run idea through Colosseum Copilot
- [ ] Create @AegisProtocol Twitter/X account
- [ ] Join Colosseum Discord
- [ ] Attend Frontier Kickoff workshop (April 7)
- [ ] Set up Anchor development environment
- [ ] Set up Helius RPC (50% off deal)
- [ ] Find 1-2 cofounders via Colosseum Cofounder Directory
- [ ] Initialize Anchor project in repo
- [ ] Deploy first empty program to devnet
- [ ] First public tweet about Aegis
