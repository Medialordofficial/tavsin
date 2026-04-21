# TavSin × Squads Multisig — Vault as Owner

Demonstrates the strongest possible TavSin posture: the **owner** of the
smart wallet is a [Squads V4](https://docs.squads.so/main/v/development/squads-v4-sdk)
multisig vault. The AI agent still operates day-to-day, but every owner-side
action — `update_policy`, `freeze_wallet`, `panic_drain`, `rotate_agent`,
`approve_request`, `withdraw` — requires `M-of-N` signatures from the
human members of the Squads vault.

## Why this matters

TavSin already separates owner ↔ agent. Putting a Squads vault in the
owner slot upgrades that separation from "single hardware wallet" to
"team-controlled, on-chain governed". For DAOs, treasuries, and
prop-trading desks, this is the only configuration that is operationally
defensible.

## Architecture

```
              ┌─────────────────────┐
              │   Squads V4 vault   │   ← owner.publicKey on TavSin
              │   (M-of-N members)  │
              └──────────┬──────────┘
                         │ vault PDA signs
              ┌──────────▼──────────┐
              │   TavSin smart      │
              │   wallet PDA        │
              └──────────┬──────────┘
                         │ agent signs
              ┌──────────▼──────────┐
              │   AI agent          │   ← bounded by policy
              └─────────────────────┘
```

The `wallet` PDA is seeded by `(owner = vault PDA, agent = agent pubkey)`
so the wallet binds permanently to the vault. There is no way for the
agent to substitute itself or another owner.

## Files

- `src/create-wallet.ts` — derives the Squads vault PDA, runs
  `tavsin.createWallet` with `owner = vault PDA`, and prints the
  resulting wallet/policy/tracker addresses.
- `src/approve-via-squads.ts` — wraps a TavSin `approve_request` call
  in a Squads transaction proposal so vault members can vote on it from
  the Squads UI before it executes on TavSin.

## Quick start

```bash
# 1. Have a funded keypair on devnet at ~/.config/solana/id.json
solana airdrop 2 --url devnet

# 2. Create a Squads V4 vault via https://app.squads.so (devnet) and
#    note the multisig pubkey.

# 3. Install + run
cd examples/squads-owner
npm install
SQUADS_MULTISIG=<multisig-pubkey> AGENT_KEYPAIR=./agent.json \
  npm run create-wallet
```

## What judges should observe

1. The TavSin program does **not** know or care that the owner is a
   multisig. From the program's view, `owner` is just a `Pubkey` that
   must sign privileged ix.
2. Squads' vault PDA is a normal signer, so it composes cleanly. No
   special TavSin code is required.
3. This means TavSin is **already** compatible with Squads, Realms,
   Mean DAO, and any other Solana governance primitive that can sign
   transactions.

## See also

- TavSin program: `programs/tavsin/`
- Owner controls: `rotate_agent`, `panic_drain`, `freeze_wallet`,
  `unfreeze_wallet`, `withdraw`, `close_*`
- Live deny feed: `app/src/app/live/page.tsx`
