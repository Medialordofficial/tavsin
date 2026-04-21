# TavSin × Realms (SPL Governance) — DAO Treasury as Owner

The same composition pattern as [`../squads-owner/`](../squads-owner/),
but with [SPL Governance / Realms](https://docs.realms.today/) — the
governance framework used by Mango, MarinDe, Marinade, MNDE, and dozens
of Solana DAOs — providing the owner key.

The TavSin smart wallet's `owner` is a **Realms Governance PDA**. Every
owner-side action (`update_policy`, `freeze_wallet`, `panic_drain`,
`rotate_agent`, `approve_request`, `withdraw`, `close_*`) must originate
from a Realms proposal that passed token-weighted voting.

## Why this matters

Squads is multisig (M-of-N humans). Realms is **on-chain governance**
(token holders vote). They cover different operational shapes:

| Use case | Owner choice |
| --- | --- |
| Trading desk, ops team | Squads (small N, fast) |
| Public DAO treasury | Realms (token-weighted, transparent) |
| Foundation operating account | Squads |
| Protocol-owned strategy | Realms |
| Family office | Squads |
| Tokenized fund | Realms |

TavSin works **identically** in both because the TavSin program does
not care what kind of key the owner is — it only checks that the owner
signs. Both Squads vault PDAs and Realms native treasury PDAs are valid
signers.

## Architecture

```
              ┌─────────────────────┐
              │  Realms Governance  │   ← token-holder votes
              │  (SPL-governance)   │
              └──────────┬──────────┘
                         │ owns
              ┌──────────▼──────────┐
              │  Native Treasury    │   ← TavSin owner = treasury PDA
              │  (PDA, signs ix)    │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  TavSin smart       │
              │  wallet PDA         │
              └──────────┬──────────┘
                         │ agent signs
              ┌──────────▼──────────┐
              │  AI agent           │   ← bounded by policy
              └─────────────────────┘
```

## Files

- [`src/derive-treasury.ts`](src/derive-treasury.ts) — derives the Realms
  native treasury PDA from a `(realm, governance)` pair and prints the
  pubkey to use as TavSin `owner`.
- [`src/propose-update-policy.ts`](src/propose-update-policy.ts) — wraps
  a TavSin `update_policy` instruction in a Realms proposal so token
  holders can vote on tightening or loosening the agent's limits.

## Quick start

```bash
cd examples/realms-owner
npm install
REALM=<realm pubkey> GOVERNANCE=<governance pubkey> npm run derive-treasury
```

## What judges should observe

This is the same one-line claim as the Squads example, but stronger:
**TavSin is governance-framework agnostic.** Any program that produces a
signing PDA — Squads, Realms, Cardinal, Mean DAO, custom — can be
plugged in as the `owner` with zero code changes to TavSin. That is the
"future-proof" property regulators and DAOs need.
