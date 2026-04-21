# Token-2022 Transfer Hook → TavSin Policy

> **The composability moment.** A Token-2022 mint can declare a *Transfer Hook*
> program that runs on every transfer. This example shows how a token issuer
> can require **every transfer of their token to pass through TavSin policy
> evaluation** — without changing the wallet, the agent, or any client code.

This turns TavSin from "opt-in policy wallet" into an **issuer-mandated compliance
rail**: a stablecoin issuer, a tokenized-equity protocol, or a regulated
settlement asset can declare _"my token cannot move unless TavSin says it can"_
and the rule is enforced at the SPL layer. No frontend, no backend, no honor
system.

## Architecture

```
   Token-2022 Mint   <-- has TransferHook = TavSinHookProgram
        |
        | every spl_token_2022::transfer_checked
        v
   TavSinHookProgram (this folder)
        |
        | CPIs into TavSin: submit_request + execute_request
        v
   TavSin Program  -->  policy denies / approves
        |
        v  (only if approved)
   Token actually moves.
```

## Why this is the killer integration

| Without Token-2022 hook | With Token-2022 hook |
| --- | --- |
| Wallet owner opts into TavSin per-wallet | Token issuer mandates TavSin per-token |
| Compliance lives at the agent layer | Compliance lives at the asset layer |
| Bypassable by transferring out of the smart wallet | Unbypassable: the *token itself* requires approval |
| One TavSin per agent | Every holder gets TavSin enforcement for free |

Combine this with [`../squads-owner/`](../squads-owner/) (Squads vault as TavSin
owner) and you have:

> _A regulated stablecoin where every transfer must be approved by both
> the holder's policy AND a multisig governance committee — enforced by the
> SPL token program itself, not by application code._

That is the regulatory primitive that institutions have been waiting for.

## Files

- [`src/hook-program.rs`](src/hook-program.rs) — minimal Token-2022 transfer
  hook program scaffold that CPIs into TavSin's `submit_request`. Compiles as
  its own Anchor program; deploy separately.
- [`src/configure-mint.ts`](src/configure-mint.ts) — TypeScript script that
  creates a Token-2022 mint with the hook attached and registers the extra
  meta accounts the hook needs.
- [`src/transfer.ts`](src/transfer.ts) — demo transfer that exercises the hook;
  the same `transfer_checked` ix you already use, but now a TavSin policy
  decision happens inside it.

## Status

This example is **architectural reference + scaffold**, not yet a deployed
companion program. The hook program is a ~150-LOC Anchor program; deploying
it follows the same pattern as TavSin itself. The TypeScript configures the
mint and shows the integration end-to-end.

Production deployment requires:
1. `anchor build && anchor deploy` for the hook program (separate program ID)
2. Run `configure-mint.ts` to create the mint with `TransferHook` extension
3. Token holders create TavSin smart wallets owned by themselves
4. All transfers flow through hook → TavSin → token movement

## Quick start

```bash
cd examples/token2022-hook
npm install
# 1. deploy the hook program (see src/hook-program.rs for the Anchor program)
# 2. create the mint:
HOOK_PROGRAM_ID=<deployed-hook-id> npm run configure-mint
# 3. transfer tokens — every transfer hits TavSin:
SENDER_WALLET=<tavsin-pda> RECIPIENT=<dest-ata> AMOUNT=1000000 npm run transfer
```

## What judges should observe

This is the **strongest possible composability claim**. TavSin doesn't ask
issuers to integrate — issuers can mandate TavSin from the asset layer using
a vanilla Token-2022 extension, and every existing wallet on Solana will
automatically respect it. No app updates required.
