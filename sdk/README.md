# @tavsin/sdk

TypeScript SDK for the **TavSin** governed smart-wallet protocol on Solana.

## Install

The SDK is currently distributed as a workspace package. Add it as a dependency from the monorepo root:

```json
{
  "dependencies": {
    "@tavsin/sdk": "file:../sdk"
  }
}
```

Peer dependencies: `@coral-xyz/anchor ^0.32`, `@solana/web3.js ^1.98`, `@solana/spl-token ^0.4`.

## Quick Start

```ts
import { Connection, Keypair } from "@solana/web3.js";
import {
  createProgram,
  getWalletPda,
  getPolicyPda,
  fetchWalletsForOwner,
} from "@tavsin/sdk";
import idl from "../target/idl/tavsin.json";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const wallet = /* your AnchorCompatibleWallet */;
const program = createProgram(idl, connection, wallet);

// Fetch all wallets owned by this key
const wallets = await fetchWalletsForOwner(program, connection, wallet.publicKey);
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Smart Wallet** | PDA-controlled vault. Owner funds it, agent spends within policy limits. |
| **Policy** | On-chain spending rules: per-tx max, daily cap, allowed programs, time windows, mint rules. |
| **Execution Request** | Agent submits a request → policy engine auto-approves or escalates → owner reviews → agent executes. |
| **Audit Entry** | Immutable on-chain record for every request decision (approved, denied, executed). |
| **Asset Tracker** | Per-mint daily spend accumulator that resets each 24-hour period. |
| **Counterparty Policy** | Owner-defined per-recipient overrides (custom limits, allow/block). |

## PDA Derivation

```ts
import {
  getWalletPda,
  getPolicyPda,
  getLegacyTrackerPda,
  getAssetTrackerPda,
  getRequestPda,
  getAuditPda,
  getCounterpartyPolicyPda,
} from "@tavsin/sdk";

const [walletPda]    = getWalletPda(ownerPubkey, agentPubkey);
const [policyPda]    = getPolicyPda(walletPda);
const [trackerPda]   = getLegacyTrackerPda(walletPda);        // for create_wallet
const [assetTracker] = getAssetTrackerPda(walletPda, mint);   // for submit/execute
const [requestPda]   = getRequestPda(walletPda, requestId);
const [auditPda]     = getAuditPda(walletPda, auditId);
const [cpPda]        = getCounterpartyPolicyPda(walletPda, recipientPubkey);
```

> **Important:** `create_wallet` uses the legacy `SpendTracker` PDA via `getLegacyTrackerPda`. `submit_request` and `execute_request` use the asset-specific `AssetSpendTracker` via `getAssetTrackerPda`.

## Building Request Payloads

### Native SOL Transfer

```ts
import { buildNativeRequestPayload } from "@tavsin/sdk";

const payload = buildNativeRequestPayload();
// payload.instructionHash, payload.accountsHash → pass to submitRequest
```

### SPL Token Transfer

```ts
import { buildSplTransferCheckedPayload, getAssociatedTokenAccountForOwner } from "@tavsin/sdk";

const source = getAssociatedTokenAccountForOwner({
  mint: usdcMint,
  owner: walletPda,
  allowOwnerOffCurve: true,
});
const destination = getAssociatedTokenAccountForOwner({
  mint: usdcMint,
  owner: recipientOwner,
});

const payload = buildSplTransferCheckedPayload({
  amount: 1_000_000n, // 1 USDC (6 decimals)
  decimals: 6,
  destination,
  mint: usdcMint,
  source,
  walletPda,
});
```

### Arbitrary CPI (e.g. Jupiter Swap)

```ts
import { buildRequestPayloadFromInstruction } from "@tavsin/sdk";

const payload = buildRequestPayloadFromInstruction(jupiterSwapIx, walletPda);
// Hashes the instruction data and accounts for on-chain verification
```

## Query Functions

| Function | Returns |
|----------|---------|
| `fetchWalletsForOwner(program, connection, owner)` | `WalletSummary[]` |
| `fetchWalletsForOwnerPage(program, connection, owner, offset, limit)` | `QueryPage<WalletSummary>` |
| `fetchWalletDetail(program, connection, walletPda)` | `WalletDetail` |
| `fetchAuditEntriesPage(program, walletPda, offset, limit)` | `QueryPage<AuditEntryData>` |
| `fetchRequestsPage(program, walletPda, offset, limit)` | `QueryPage<ExecutionRequestData>` |
| `fetchPendingApprovalsForOwner(program, connection, owner, offset, limit)` | `QueryPage<PendingApprovalItem>` |
| `fetchCounterpartyPolicy(program, walletPda, recipient)` | `CounterpartyPolicyData \| null` |
| `fetchCounterpartyPoliciesForWalletPage(program, walletPda, offset, limit, search?)` | `QueryPage<CounterpartyPolicyData>` |

## Constants

```ts
import {
  PROGRAM_ID,       // 2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy
  NATIVE_MINT,      // PublicKey.default (represents SOL)
  REQUEST_STATUSES, // { 0: "Pending", 1: "Approved", 2: "Rejected", 3: "Executed", 4: "Expired" }
  DENIAL_REASONS,   // { 0: "Approved", 1: "Exceeds per-tx limit", ... }
} from "@tavsin/sdk";
```

## Types

All account data types are exported:

- `SmartWalletAccountData`
- `PolicyAccountData`
- `MintRuleData`
- `ExecutionRequestData`
- `AuditEntryData`
- `AssetSpendTrackerData`
- `LegacySpendTrackerData`
- `CounterpartyPolicyData`
- `WalletSummary`
- `WalletDetail`
- `PendingApprovalItem`

## Utilities

```ts
import { shortenAddress, lamportsToSol, decimalAmountToBaseUnits } from "@tavsin/sdk";

shortenAddress("2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy", 4); // "2VzG...cbFy"
lamportsToSol(50_000_000);         // "0.0500"
decimalAmountToBaseUnits("1.5", 9); // 1500000000n
```

## Full E2E Example

See [`scripts/agent-bot.ts`](../scripts/agent-bot.ts) for a complete 7-step devnet demo:

1. Create wallet → 2. Fund → 3. Set approval threshold → 4. Agent submits request → 5. Owner approves → 6. Agent executes → 7. Print audit trail

See [`scripts/jupiter-swap.ts`](../scripts/jupiter-swap.ts) for a governed Jupiter DEX swap demo.

## License

MIT — see [LICENSE](../LICENSE).
