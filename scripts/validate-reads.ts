/**
 * Read-layer validation script.
 *
 * Exercises the same SDK query functions the API routes use.
 * Run against any cluster to verify reads work end-to-end:
 *
 *   TAVSIN_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=KEY \
 *   TAVSIN_PROGRAM_ID=2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy \
 *     npx ts-node --esm scripts/validate-reads.ts <OWNER_PUBKEY>
 */

import { Connection, PublicKey } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import {
  createReadonlyProgram,
  fetchWalletsForOwnerPage,
  fetchWalletDetail,
  fetchAuditEntriesPage,
  fetchRequestsPage,
  fetchPendingApprovalsForOwner,
  PROGRAM_ID,
} from "@tavsin/sdk";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const idlJson = require("../target/idl/tavsin.json");

const rpcUrl =
  process.env.TAVSIN_SOLANA_RPC_URL ??
  process.env.HELIUS_RPC_URL ??
  "https://api.devnet.solana.com";

const programId = process.env.TAVSIN_PROGRAM_ID
  ? new PublicKey(process.env.TAVSIN_PROGRAM_ID)
  : PROGRAM_ID;

const ownerArg = process.argv[2];
if (!ownerArg) {
  console.error("Usage: npx ts-node --esm scripts/validate-reads.ts <OWNER>");
  process.exit(1);
}

const owner = new PublicKey(ownerArg);
const connection = new Connection(rpcUrl, "confirmed");
const program = createReadonlyProgram(idlJson as Idl, connection, programId);

interface TimedResult<T> {
  label: string;
  ms: number;
  result: T;
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<TimedResult<T>> {
  const start = Date.now();
  const result = await fn();
  const ms = Date.now() - start;
  return { label, ms, result };
}

async function run() {
  console.log(`\nValidating read layer`);
  console.log(`  RPC    : ${rpcUrl.replace(/api-key=[^&]+/, "api-key=***")}`);
  console.log(`  Program: ${programId.toBase58()}`);
  console.log(`  Owner  : ${owner.toBase58()}\n`);

  // 1. Slot check
  const slot = await timed("getSlot", () => connection.getSlot());
  console.log(`✓ ${slot.label} → slot ${slot.result} (${slot.ms}ms)`);

  // 2. Wallet list
  const wallets = await timed("fetchWalletsForOwnerPage", () =>
    fetchWalletsForOwnerPage(program, connection, owner, 0, 25)
  );
  console.log(
    `✓ ${wallets.label} → ${wallets.result.total} wallet(s) (${wallets.ms}ms)`
  );

  if (wallets.result.total === 0) {
    console.log("\nNo wallets found for this owner. Skipping detail queries.\n");
    printSummary([slot, wallets]);
    return;
  }

  const firstWallet = wallets.result.items[0].publicKey;
  console.log(`  Using wallet: ${firstWallet.toBase58()}\n`);

  // 3. Wallet detail
  const detail = await timed("fetchWalletDetail", () =>
    fetchWalletDetail(program, connection, firstWallet, 10)
  );
  console.log(
    `✓ ${detail.label} → ${detail.result.auditCount} audit(s), ${detail.result.requestCount} request(s) (${detail.ms}ms)`
  );

  // 4. Audit entries page
  const audits = await timed("fetchAuditEntriesPage", () =>
    fetchAuditEntriesPage(program, firstWallet, 0, 10)
  );
  console.log(
    `✓ ${audits.label} → ${audits.result.items.length}/${audits.result.total} entries (${audits.ms}ms)`
  );

  // 5. Requests page
  const requests = await timed("fetchRequestsPage", () =>
    fetchRequestsPage(program, firstWallet, 0, 10)
  );
  console.log(
    `✓ ${requests.label} → ${requests.result.items.length}/${requests.result.total} entries (${requests.ms}ms)`
  );

  // 6. Pending approvals
  const pending = await timed("fetchPendingApprovalsForOwner", () =>
    fetchPendingApprovalsForOwner(program, connection, owner, 0, 10)
  );
  console.log(
    `✓ ${pending.label} → ${pending.result.total} pending (${pending.ms}ms)`
  );

  // 7. Concurrent load test — 10 parallel wallet-list reads
  const concurrentStart = Date.now();
  const concurrentResults = await Promise.all(
    Array.from({ length: 10 }, () =>
      fetchWalletsForOwnerPage(program, connection, owner, 0, 25)
    )
  );
  const concurrentMs = Date.now() - concurrentStart;
  const allSucceeded = concurrentResults.every((r) => r.total >= 0);
  console.log(
    `✓ concurrent (10x walletList) → ${allSucceeded ? "all OK" : "FAILURES"} (${concurrentMs}ms total)\n`
  );

  printSummary([slot, wallets, detail, audits, requests, pending]);
}

function printSummary(results: TimedResult<unknown>[]) {
  console.log("── Summary ──────────────────────────────");
  for (const r of results) {
    const status = r.ms < 2000 ? "✓" : r.ms < 5000 ? "⚠" : "✗";
    console.log(`  ${status} ${r.label.padEnd(35)} ${r.ms}ms`);
  }
  const maxMs = Math.max(...results.map((r) => r.ms));
  console.log(
    `\n  Slowest query: ${maxMs}ms ${maxMs > 5000 ? "(NEEDS ATTENTION)" : "(OK)"}\n`
  );
}

run().catch((err) => {
  console.error("\n✗ Validation failed:", err.message || err);
  process.exit(1);
});
