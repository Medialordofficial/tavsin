# TavSin Full Launch Plan

This document converts the current launch audit into an implementation plan for a real product release. It assumes TavSin will launch as a policy-enforced smart wallet protocol for AI agents on Solana, not as a demo-only SOL transfer app.

## Release Gates

TavSin is not ready for a full launch until all of the following are true:

- Real governed execution exists for actual CPI and token flows, not only direct lamport transfer.
- Policy checks bind to the instruction that will actually be executed.
- Approval-required requests are enforced on-chain.
- Token-aware controls exist for blocked mints and per-asset spend tracking.
- Counterparty or vendor controls exist beyond program allowlists.
- The frontend consumes a standalone SDK rather than app-local helpers.
- Wallet, audit, request, and policy reads are index-backed and scalable.
- Tests are reproducible from a clean machine.
- A security review has been completed and launch-blocking findings are closed.
- Mainnet deployment, monitoring, and rollback procedures are documented.

## 1. Engineering Backlog

### TL-01 Governed Execution Engine

- Priority: P0
- Depends on: none
- Goal: replace the current SOL-only execute path with real instruction execution guarded by on-chain policy.
- Deliverables:
- Introduce a request model that captures target program, asset mint, recipient, amount, instruction hash, accounts hash, and memo.
- Replace the current transfer logic in the execute flow with `invoke_signed`-based execution for approved requests.
- Add SPL token transfer support through wallet-owned token accounts.
- Acceptance criteria:
- A request that passes policy can execute the intended instruction, not a surrogate transfer.
- Program allowlist checks are performed against the actual executed program id.
- Asset and recipient checks are performed against the actual request payload.
- Replay of a previously executed request is rejected.
- Existing freeze and withdraw flows still work.

### TL-02 Policy V2

- Priority: P0
- Depends on: TL-01
- Goal: expand the policy model to match the product surface TavSin claims to offer.
- Deliverables:
- Add policy fields for blocked mints, allowed recipients, approval threshold, and require-approval behavior.
- Add mint-specific controls so SOL and SPL tokens can be governed independently.
- Add rule versioning so the client and program can reason about policy upgrades safely.
- Acceptance criteria:
- Policy can independently deny by program, recipient, mint, amount, and time window.
- Policies can require approval above a threshold rather than only hard-denying.
- Asset-specific limits are enforced against the correct asset tracker.
- Policy upgrade path does not orphan existing wallets.

### TL-03 Approval Workflow

- Priority: P0
- Depends on: TL-01, TL-02
- Goal: add owner approval and rejection for requests that exceed low-risk autonomy boundaries.
- Deliverables:
- Add a request account with `pending`, `approved`, `rejected`, `executed`, and `expired` states.
- Add owner instructions to approve or reject pending requests.
- Bind approval to request hashes so the executed instruction cannot differ from the reviewed instruction.
- Acceptance criteria:
- Requests above threshold enter `pending` instead of executing.
- Only the wallet owner can approve or reject.
- Approved requests execute exactly the hashed instruction and accounts set.
- Expired or previously executed requests cannot execute.

### TL-04 Counterparty Controls

- Priority: P0
- Depends on: TL-02
- Goal: support vendor or recipient-specific policies rather than relying only on global allowlists.
- Deliverables:
- Add a counterparty policy account per wallet and recipient.
- Support per-recipient overrides such as `require_approval`, `max_per_tx`, `max_daily`, and allowed mints.
- Acceptance criteria:
- A recipient can be globally blocked even if the target program is allowed.
- A recipient can require manual approval even when other recipients do not.
- A counterparty-specific limit overrides or narrows the wallet default policy.

### TL-05 Asset Tracking and Audit Semantics

- Priority: P0
- Depends on: TL-01, TL-02
- Goal: make budget enforcement and audit logs meaningful for real assets and operator review.
- Deliverables:
- Replace the single wallet-level spend tracker with per-asset spend trackers.
- Expand audit entries to include recipient, asset mint, request id, outcome, and reason code.
- Acceptance criteria:
- SOL and each governed SPL mint track spend independently.
- Audit entries fully explain approval, denial, escalation, rejection, and execution outcomes.
- Audit data is sufficient for a dashboard without inference from transaction logs.

### TL-06 SDK Package

- Priority: P1
- Depends on: TL-01, TL-02, TL-03
- Goal: create a real `@tavsin/sdk` package consumed by both the app and external developers.
- Deliverables:
- Add a repo-local `sdk` package with typed clients, PDA helpers, request builders, and query helpers.
- Migrate the frontend away from `app/src/lib/program.ts`.
- Acceptance criteria:
- The app imports the SDK instead of internal program helper code.
- A fresh external sample can create a wallet, submit a request, and fetch its audit history.
- The SDK exposes typed errors and account shapes for policy, request, tracker, and audit objects.

### TL-07 Indexed Read Layer

- Priority: P1
- Depends on: TL-03, TL-05
- Goal: replace demo-grade account scanning with scalable reads.
- Deliverables:
- Add a read service or query layer backed by Helius or equivalent indexing.
- Add API endpoints or SDK queries for wallet list, pending approvals, audit pages, and counterparty policies.
- Acceptance criteria:
- Dashboard loads fleet, audit, and pending approvals without iterative PDA probing.
- Audit entries are paginated.
- Pending requests are queryable without full wallet scans.

### TL-08 Frontend Operator Console

- Priority: P1
- Depends on: TL-03, TL-06, TL-07
- Goal: upgrade the dashboard from wallet viewer to operator console.
- Deliverables:
- Add approval queue UI.
- Add policy editor sections for recipients, blocked mints, and approval thresholds.
- Add request status surfaces for `pending`, `rejected`, `expired`, and `executed`.
- Acceptance criteria:
- Owners can review and act on pending requests from the UI.
- Policy editing supports all launch policy primitives.
- Wallet detail pages show request lifecycle and richer audit data.

### TL-09 Validation and Security

- Priority: P0
- Depends on: TL-01 through TL-08
- Goal: make the protocol trustworthy to ship.
- Deliverables:
- Fix local test infrastructure and document exact setup.
- Add negative tests for every policy rule and request state transition.
- Get a focused external security review.
- Acceptance criteria:
- Test suite passes from a clean machine.
- Critical request-path invariants are covered by tests.
- No open high-severity security findings remain at launch time.

### TL-10 Mainnet Launch Operations

- Priority: P0
- Depends on: TL-09
- Goal: make deployment, monitoring, and incident handling production-ready.
- Deliverables:
- Mainnet configuration, upgrade authority policy, RPC failover, monitoring, and rollback runbook.
- Acceptance criteria:
- Mainnet IDs and env vars are finalized.
- Incident owner and freeze procedure are documented.
- The app clearly distinguishes devnet from mainnet.

## 2. On-Chain Account Model

The current model is too narrow for a full launch. The updated account model should remain simple, but it must support approvals, blocked tokens, and counterparty controls.

### SmartWallet V2

Purpose: root authority and lifecycle record for an owner-agent pair.

Core fields:

```rust
pub struct SmartWallet {
    pub version: u8,
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub status: u8,
    pub bump: u8,
    pub next_request_id: u64,
    pub total_approved: u64,
    pub total_denied: u64,
    pub total_pending: u64,
    pub created_at: i64,
}
```

Notes:

- Replace the bare `frozen: bool` with a `status` enum so future states like `paused` or `sunset` do not require another breaking migration.
- `next_request_id` becomes the canonical request nonce.

### Policy V2

Purpose: wallet-wide default policy enforced against every request.

Core fields:

```rust
pub struct Policy {
    pub version: u8,
    pub wallet: Pubkey,
    pub default_max_per_tx_lamports: u64,
    pub default_daily_limit_lamports: u64,
    pub approval_threshold_lamports: u64,
    pub require_approval_for_new_recipient: bool,
    pub allow_all_programs: bool,
    pub allowed_programs: Vec<Pubkey>,
    pub allowed_recipients: Vec<Pubkey>,
    pub blocked_mints: Vec<Pubkey>,
    pub mint_rules: Vec<MintRule>,
    pub time_window_start: Option<i64>,
    pub time_window_end: Option<i64>,
    pub bump: u8,
}

pub struct MintRule {
    pub mint: Pubkey,
    pub max_per_tx: u64,
    pub daily_limit: u64,
    pub require_approval_above: Option<u64>,
}
```

Notes:

- `blocked_mints` is the direct answer to the missing blocked-token claim.
- `mint_rules` let TavSin govern assets independently instead of treating all amounts as lamports.

### AssetSpendTracker

Purpose: rolling spend window per wallet and per asset.

Seeds:

- `[b"tracker", wallet.key(), asset_mint_or_native_marker]`

Core fields:

```rust
pub struct AssetSpendTracker {
    pub wallet: Pubkey,
    pub asset_mint: Pubkey,
    pub spent_in_period: u64,
    pub period_start: i64,
    pub period_duration: i64,
    pub bump: u8,
}
```

Notes:

- Use `Pubkey::default()` or a dedicated constant to represent native SOL.
- This replaces the single global tracker that cannot safely govern multiple mints.

### CounterpartyPolicy

Purpose: vendor or recipient-specific override policy.

Seeds:

- `[b"counterparty", wallet.key(), recipient.key()]`

Core fields:

```rust
pub struct CounterpartyPolicy {
    pub wallet: Pubkey,
    pub recipient: Pubkey,
    pub enabled: bool,
    pub require_approval: bool,
    pub max_per_tx_override: Option<u64>,
    pub daily_limit_override: Option<u64>,
    pub allowed_mints: Vec<Pubkey>,
    pub bump: u8,
}
```

Notes:

- This is the simplest durable form of vendor control for launch.
- It keeps the protocol deterministic without relying on off-chain vendor registries.

### ExecutionRequest

Purpose: canonical record of what the agent asked the wallet to do.

Seeds:

- `[b"request", wallet.key(), request_id.to_le_bytes()]`

Core fields:

```rust
pub struct ExecutionRequest {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub agent: Pubkey,
    pub target_program: Pubkey,
    pub recipient: Pubkey,
    pub asset_mint: Pubkey,
    pub amount: u64,
    pub status: u8,
    pub instruction_hash: [u8; 32],
    pub accounts_hash: [u8; 32],
    pub memo: String,
    pub requested_at: i64,
    pub expires_at: Option<i64>,
    pub reviewed_by: Option<Pubkey>,
    pub reviewed_at: Option<i64>,
    pub bump: u8,
}
```

Status enum:

- `0 = pending`
- `1 = approved`
- `2 = rejected`
- `3 = executed`
- `4 = expired`

Notes:

- The hashed instruction payload prevents approval drift.
- This account is the core primitive for both auto-approved and manually approved execution.

### AuditEntry V2

Purpose: immutable operator-readable record of every policy decision.

Core fields:

```rust
pub struct AuditEntry {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub approved: bool,
    pub outcome: u8,
    pub amount: u64,
    pub asset_mint: Pubkey,
    pub target_program: Pubkey,
    pub recipient: Pubkey,
    pub denial_reason: u8,
    pub memo: String,
    pub timestamp: i64,
    pub bump: u8,
}
```

Outcome enum:

- `approved`
- `denied`
- `pending_approval`
- `rejected_by_owner`
- `executed`
- `expired`

### Instruction Model

The launch instruction set should become:

- `create_wallet`
- `fund_wallet`
- `withdraw`
- `freeze_wallet`
- `unfreeze_wallet`
- `update_policy`
- `upsert_counterparty_policy`
- `submit_request`
- `approve_request`
- `reject_request`
- `execute_request`

Execution flow:

1. Agent submits a request with actual target metadata and payload hashes.
2. Program evaluates wallet status, time window, program allowlist, mint rules, counterparty rules, and budget trackers.
3. If rule outcome is deny, write audit and stop.
4. If rule outcome is require approval, persist `pending` request and write audit.
5. If rule outcome is approve, execute immediately or mark approved for execution in the same transaction path.
6. Update the asset tracker and write final audit outcome.

## 3. File-by-File Change Map

### Rust Program

Existing files to change:

- [programs/tavsin/src/lib.rs](programs/tavsin/src/lib.rs)
  - Add new entrypoints for `submit_request`, `approve_request`, `reject_request`, and `upsert_counterparty_policy`.
  - Refactor `execute` into the new request-oriented model or replace it with `execute_request`.

- [programs/tavsin/src/state/mod.rs](programs/tavsin/src/state/mod.rs)
  - Add `version` and request counters to `SmartWallet`.
  - Replace or extend `Policy` with policy v2 fields.
  - Replace `SpendTracker` with `AssetSpendTracker`.
  - Add `CounterpartyPolicy` and `ExecutionRequest`.
  - Expand `AuditEntry` to record asset, recipient, request id, and richer outcomes.

- [programs/tavsin/src/error.rs](programs/tavsin/src/error.rs)
  - Add explicit errors for blocked mint, recipient not allowed, approval required, request expired, request already executed, request hash mismatch, and invalid asset tracker.

- [programs/tavsin/src/constants.rs](programs/tavsin/src/constants.rs)
  - Add PDA seeds for `request` and `counterparty`.
  - Add constants for native asset marker, max list sizes, and request expiry defaults.

- [programs/tavsin/src/instructions/create_wallet.rs](programs/tavsin/src/instructions/create_wallet.rs)
  - Initialize the v2 wallet and policy.
  - Initialize the native asset tracker.

- [programs/tavsin/src/instructions/update_policy.rs](programs/tavsin/src/instructions/update_policy.rs)
  - Accept the expanded policy payload.
  - Validate maximum vector sizes and policy invariants.

- [programs/tavsin/src/instructions/execute.rs](programs/tavsin/src/instructions/execute.rs)
  - Stop using the declared `target_program` as a policy-only hint.
  - Replace direct lamport mutation with request validation and actual program execution.

- [programs/tavsin/src/instructions/mod.rs](programs/tavsin/src/instructions/mod.rs)
  - Export the new instruction modules.

New Rust files to add:

- `programs/tavsin/src/instructions/submit_request.rs`
- `programs/tavsin/src/instructions/approve_request.rs`
- `programs/tavsin/src/instructions/reject_request.rs`
- `programs/tavsin/src/instructions/execute_request.rs`
- `programs/tavsin/src/instructions/upsert_counterparty_policy.rs`
- `programs/tavsin/src/instructions/shared.rs`

Suggested responsibilities for `shared.rs`:

- request hash verification
- time-window checks
- program, mint, and recipient policy evaluation
- approval requirement resolution
- asset tracker reset and increment logic
- audit write helpers

### Tests

Existing files to change:

- [tests/tavsin.ts](tests/tavsin.ts)
  - Split current tests into request lifecycle coverage.
  - Add tests for blocked mint, blocked recipient, pending approval, approval mismatch, expired request, and token-specific limits.

New tests to add:

- `tests/tavsin-approvals.ts`
- `tests/tavsin-counterparties.ts`
- `tests/tavsin-spl.ts`
- `tests/tavsin-replay.ts`

### SDK

New package to add:

- `sdk/package.json`
- `sdk/tsconfig.json`
- `sdk/src/index.ts`
- `sdk/src/client.ts`
- `sdk/src/pdas.ts`
- `sdk/src/types.ts`
- `sdk/src/requests.ts`
- `sdk/src/queries.ts`
- `sdk/src/errors.ts`

Minimum SDK surface:

- wallet creation and funding helpers
- policy and counterparty update helpers
- request submission and approval helpers
- PDA derivation helpers
- typed account decoders
- index-backed read helpers

App files to migrate:

- [app/src/lib/program.ts](app/src/lib/program.ts)
  - Reduce to compatibility wrappers or remove after migration.

- [app/src/hooks/useTavsin.ts](app/src/hooks/useTavsin.ts)
  - Replace direct Anchor account probing with SDK query helpers.
  - Add pending request queries and paginated audit reads.

### Frontend

Existing files to change:

- [app/src/app/wallet/[address]/page.tsx](app/src/app/wallet/[address]/page.tsx)
  - Add pending approvals section.
  - Add asset-aware balances and tracker cards.
  - Add request status timeline and richer audit presentation.

- [app/src/components/CreateWalletModal.tsx](app/src/components/CreateWalletModal.tsx)
  - Add policy fields for blocked mints, approval threshold, recipient controls, and default approval behavior.

- [app/src/app/dashboard/page.tsx](app/src/app/dashboard/page.tsx)
  - Add fleet-level pending approvals, denied-request monitoring, and counterparty insights.

- [app/src/components/SolanaProvider.tsx](app/src/components/SolanaProvider.tsx)
  - Separate devnet and mainnet configs cleanly.
  - Surface environment context to the UI.

Likely new frontend files:

- `app/src/components/ApprovalQueue.tsx`
- `app/src/components/PolicyEditorV2.tsx`
- `app/src/components/CounterpartyPolicyForm.tsx`
- `app/src/components/AuditTable.tsx`
- `app/src/components/RequestStatusPill.tsx`
- `app/src/lib/env.ts`

### Read Layer

Likely additions:

- `app/src/app/api/wallets/route.ts`
- `app/src/app/api/requests/route.ts`
- `app/src/app/api/audit/route.ts`

Responsibilities:

- paginated wallet fleet queries
- pending approval queries
- audit log pagination and filters
- environment-aware program configuration

## 4. Recommended Build Order

1. Refactor the on-chain request and execution model.
2. Add policy v2, asset trackers, and counterparty controls.
3. Add approval workflow and request lifecycle tests.
4. Extract the SDK and migrate the frontend to it.
5. Add indexed read paths and operator console UI.
6. Complete validation, security review, and mainnet operations.

## 5. Definition of Done

TavSin is ready for a full launch when:

- The protocol can govern real instructions and token flows.
- The policy surface exposed in the app is the same policy surface enforced on-chain.
- Approval-required flows are non-bypassable.
- Operators can inspect pending requests and audit trails without raw chain spelunking.
- The SDK is usable outside the app.
- The full test suite and launch runbook work on a clean machine.