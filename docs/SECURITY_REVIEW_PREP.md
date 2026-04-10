# TavSin Security Review Prep

## Review Goals

- Validate request hash and account-hash binding.
- Validate wallet-PDA signing boundaries and CPI account normalization.
- Validate approval workflow state transitions.
- Validate asset-specific spend tracking and counterparty overrides.
- Validate freeze and withdrawal safety.

## Reviewer Package

Provide the reviewer with:

1. The exact audited commit SHA.
2. Program ID(s) per environment.
3. This repository plus `FULL_LAUNCH_PLAN.md`.
4. Test commands:
   - `anchor build`
   - `npm run test:anchor:skip-build`
   - `npm --prefix app run build`
5. Threat model notes below.

## Current Evidence (auto-captured)

- **Commit SHA**: `74d2326baffe85389d724f6397f6a31cffc46c03`
- **Program binary hash** (`target/deploy/tavsin.so`): `6deafd3d442bbaa6186b2cd36db31fe8bcc89fb1bf4326085252128e65ebd22d`
- **Program ID**: `2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy`
- **Test suite**: 11/11 passing (tavsin-policy: 3, tavsin-requests: 7, tavsin-spl: 1)
- **App build**: compiles with zero errors
- **Lint**: passes (app + root)
- **SDK typecheck**: passes

## High-Risk Surfaces

- `submit_request`: policy enforcement and escalation transitions.
- `approve_request` / `reject_request`: owner-only controls and replay prevention.
- `execute_request` / `execute_request_with_payload`: instruction hash, account hash, and signer normalization.
- `update_policy`: owner-only policy mutation and list clearing behavior.
- `upsert_counterparty_policy`: recipient-specific narrowing of wallet policy.

## Threat Model Checklist

- Attempt request replay after `executed`, `rejected`, and `expired` states.
- Attempt payload substitution after owner approval.
- Attempt signer escalation using wallet PDA meta ordering.
- Attempt counterparty bypass through alternate token accounts or recipients.
- Attempt budget bypass across native and SPL asset trackers.
- Attempt stale or malformed mint rule updates.
- Attempt unauthorized freeze, unfreeze, withdraw, and policy mutation.

## Evidence To Gather Before Review

- ~~Passing test output from current release candidate.~~ *Done — 11/11 tests pass.*
- ~~Production build output for the app.~~ *Done — zero errors.*
- List of known limitations that are intentionally deferred.
- Owner / agent trust assumptions.
- RPC topology and operational assumptions for the read API.

## Known Limitations (Intentionally Deferred)

- Token account creation is assumed to happen externally before SPL requests. The program does not auto-create ATAs.
- Policy list sizes (allowed programs, recipients, blocked mints, mint rules) are unbounded in the type but constrained by Solana account size and transaction compute limits.
- The read layer relies on `getMultipleAccountsInfo` and `memcmp` filters rather than an indexed database; production deployments should use a managed RPC (e.g. Helius) for scalability.
- Counterparty policies do not cascade deletion when the parent wallet is frozen or withdrawn — stale accounts may remain on-chain.
- Time windows use on-chain `Clock::unix_timestamp`, which can drift by several seconds on Solana.

## Trust Assumptions

- The wallet **owner** is the sole root of trust. Only the owner can approve requests, mutate policy, freeze/unfreeze, and withdraw.
- The **agent** can only submit requests. It cannot approve, execute on its own above thresholds, or modify policy.
- CPI execution uses `invoke_signed` with the wallet PDA as signer. The instruction and accounts must exactly match the hashes committed at request submission time.
- The read API (Next.js server routes) is unauthenticated — it serves public on-chain data. No private state is exposed.

## Findings Workflow

Use the following severity model:

- Critical: funds loss, approval bypass, arbitrary PDA signing, or permanent lockup.
- High: policy bypass under realistic conditions, privilege escalation, replay, or incorrect spend accounting.
- Medium: denial-of-service, confusing lifecycle behavior, or broken operator guarantees.
- Low: documentation gaps, monitoring blind spots, or non-exploitable inconsistencies.

Track every finding with:

- title
- severity
- impacted component
- reproduction steps
- fixed commit
- retest status

## Exit Criteria

- No open Critical or High findings.
- Medium findings have explicit launch waivers and mitigation owners.
- Release branch and deployed binary are revalidated after any remediation.