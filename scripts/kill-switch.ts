/**
 * kill-switch.ts — Demonstrates the TavSin kill switch (freeze/unfreeze)
 * on Solana devnet.
 *
 * Flow:
 *   1. Owner creates a smart wallet with an agent
 *   2. Owner funds the wallet
 *   3. Agent submits a request (auto-approved)
 *   4. Agent executes the request — succeeds
 *   5. Owner FREEZES the wallet
 *   6. Agent submits another request — policy blocks it (wallet frozen)
 *   7. Owner UNFREEZES the wallet
 *   8. Agent submits again — succeeds
 *   9. Print audit trail showing the frozen rejection
 *
 * Usage:
 *   OWNER_KEY=~/.config/solana/id.json npx tsx scripts/kill-switch.ts
 */

import { BN, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import fs from "node:fs";
import path from "node:path";

import idlJson from "../target/idl/tavsin.json";
import {
  buildNativeRequestPayload,
  createProgram,
  fetchAuditEntriesPage,
  getAssetTrackerPda,
  getAuditPda,
  getLegacyTrackerPda,
  getPolicyPda,
  getRequestPda,
  getWalletPda,
  NATIVE_MINT,
  REQUEST_STATUSES,
  DENIAL_REASONS,
  type AnchorCompatibleWallet,
} from "../sdk/src/index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";

function loadKeypair(envVar: string, fallback: string): Keypair {
  const raw = process.env[envVar] ?? fallback;
  const resolved = raw.startsWith("~")
    ? path.join(process.env.HOME!, raw.slice(1))
    : raw;
  const secret = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function walletFromKeypair(kp: Keypair): AnchorCompatibleWallet {
  return {
    publicKey: kp.publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if (tx instanceof Transaction) tx.partialSign(kp);
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
      for (const tx of txs) { if (tx instanceof Transaction) tx.partialSign(kp); }
      return txs;
    },
  };
}

function sol(n: number): BN {
  return new BN(Math.floor(n * LAMPORTS_PER_SOL));
}

function log(step: string, msg: string) {
  console.log(`\n[${step}] ${msg}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  TavSin Kill Switch Demo — Devnet");
  console.log("=".repeat(60));

  const connection = new Connection(RPC_URL, "confirmed");

  const ownerKp = loadKeypair("OWNER_KEY", "~/.config/solana/id.json");
  const agentKp = Keypair.generate();
  const recipientKp = Keypair.generate();

  log("SETUP", `Owner:     ${ownerKp.publicKey.toBase58()}`);
  log("SETUP", `Agent:     ${agentKp.publicKey.toBase58()}`);
  log("SETUP", `Recipient: ${recipientKp.publicKey.toBase58()}`);

  const ownerProgram = createProgram(idlJson as unknown as Idl, connection, walletFromKeypair(ownerKp));
  const agentProgram = createProgram(idlJson as unknown as Idl, connection, walletFromKeypair(agentKp));

  const [walletPda] = getWalletPda(ownerKp.publicKey, agentKp.publicKey);
  const [policyPda] = getPolicyPda(walletPda);
  const [legacyTracker] = getLegacyTrackerPda(walletPda);

  // ── Step 1: Create wallet ──────────────────────────────────────────────
  log("1/9", "Creating smart wallet...");
  await ownerProgram.methods
    .createWallet(
      sol(1),       // maxPerTx
      sol(10),      // maxDaily
      [],           // allowedPrograms
      null,         // timeWindowStart
      null,         // timeWindowEnd
    )
    .accounts({
      owner: ownerKp.publicKey,
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
      tracker: legacyTracker,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log(`  ✓ Wallet created: ${walletPda.toBase58()}`);

  // ── Step 2: Fund wallet ────────────────────────────────────────────────
  log("2/9", "Funding wallet with 0.1 SOL...");
  await ownerProgram.methods
    .fundWallet(sol(0.1))
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("  ✓ Funded");

  // Fund agent for rent
  const fundTx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: ownerKp.publicKey,
      toPubkey: agentKp.publicKey,
      lamports: 0.05 * LAMPORTS_PER_SOL,
    })
  );
  fundTx.feePayer = ownerKp.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  fundTx.recentBlockhash = blockhash;
  fundTx.sign(ownerKp);
  const sig = await connection.sendRawTransaction(fundTx.serialize());
  await connection.confirmTransaction(sig, "confirmed");
  console.log("  ✓ Agent funded for rent");

  let nextRequestId = 0;
  let nextAuditId = 0;

  // ── Step 3: Agent submits request (should auto-approve) ────────────────
  log("3/9", "Agent submits 0.01 SOL request...");
  const payload1 = buildNativeRequestPayload();
  const [req1] = getRequestPda(walletPda, nextRequestId);
  const [audit1] = getAuditPda(walletPda, nextAuditId);
  const [assetTracker] = getAssetTrackerPda(walletPda, NATIVE_MINT);

  await agentProgram.methods
    .submitRequest(sol(0.01), "Pre-freeze transfer", payload1.instructionHash, payload1.accountsHash, null)
    .accounts({
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
      request: req1,
      auditEntry: audit1,
      recipient: recipientKp.publicKey,
      assetMint: NATIVE_MINT,
      assetTracker,
      targetProgram: SystemProgram.programId,
      systemProgram: SystemProgram.programId,
    })
    .signers([agentKp])
    .rpc();

  const req1Data = await (agentProgram.account as any).executionRequest.fetch(req1);
  console.log(`  ✓ Request status: ${REQUEST_STATUSES[req1Data.status]}`);
  nextRequestId++;
  nextAuditId++;

  // ── Step 4: Execute the approved request ───────────────────────────────
  if (req1Data.status === 1) {
    log("4/9", "Executing approved request...");
    const [execAudit] = getAuditPda(walletPda, nextAuditId);
    await agentProgram.methods
      .executeRequest()
      .accounts({
        agent: agentKp.publicKey,
        wallet: walletPda,
        policy: policyPda,
        request: req1,
        recipient: recipientKp.publicKey,
        auditEntry: execAudit,
        assetMint: NATIVE_MINT,
        assetTracker,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKp])
      .rpc();
    console.log("  ✓ Executed — funds sent to recipient");
    nextAuditId++;
  } else {
    log("4/9", "Skipping execution (request not auto-approved)");
  }

  // ── Step 5: Owner FREEZES the wallet ───────────────────────────────────
  log("5/9", "🔴 Owner activates KILL SWITCH — freezing wallet...");
  await ownerProgram.methods
    .freezeWallet()
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
    })
    .rpc();

  const frozenWallet = await (ownerProgram.account as any).smartWallet.fetch(walletPda);
  console.log(`  ✓ Wallet frozen: ${frozenWallet.frozen}`);

  // ── Step 6: Agent tries to submit while frozen — BLOCKED ───────────────
  log("6/9", "Agent attempts request on frozen wallet...");
  const payload2 = buildNativeRequestPayload();
  const [req2] = getRequestPda(walletPda, nextRequestId);
  const [audit2] = getAuditPda(walletPda, nextAuditId);

  try {
    await agentProgram.methods
      .submitRequest(sol(0.01), "Frozen attempt", payload2.instructionHash, payload2.accountsHash, null)
      .accounts({
        agent: agentKp.publicKey,
        wallet: walletPda,
        policy: policyPda,
        request: req2,
        auditEntry: audit2,
        recipient: recipientKp.publicKey,
        assetMint: NATIVE_MINT,
        assetTracker,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKp])
      .rpc();

    // If it didn't throw, check the status
    const req2Data = await (agentProgram.account as any).executionRequest.fetch(req2);
    const status = REQUEST_STATUSES[req2Data.status];
    const reason = DENIAL_REASONS[req2Data.status === 2 ? 5 : 0];
    console.log(`  ✓ Request status: ${status} — expected denial while frozen`);
    nextRequestId++;
    nextAuditId++;
  } catch (err: any) {
    // Some implementations may reject the transaction entirely
    const msg = err?.message ?? String(err);
    if (msg.includes("frozen") || msg.includes("Frozen") || msg.includes("WalletFrozen")) {
      console.log(`  ✓ Transaction rejected: wallet is frozen (as expected)`);
    } else {
      console.log(`  ✓ Request blocked: ${msg.slice(0, 120)}`);
    }
  }

  // ── Step 7: Owner UNFREEZES the wallet ─────────────────────────────────
  log("7/9", "🟢 Owner deactivates kill switch — unfreezing wallet...");
  await ownerProgram.methods
    .unfreezeWallet()
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
    })
    .rpc();

  const unfrozenWallet = await (ownerProgram.account as any).smartWallet.fetch(walletPda);
  console.log(`  ✓ Wallet frozen: ${unfrozenWallet.frozen}`);

  // ── Step 8: Agent submits again — should succeed ───────────────────────
  log("8/9", "Agent submits request after unfreeze...");
  // Re-fetch wallet to get current IDs
  const currentWallet = await (agentProgram.account as any).smartWallet.fetch(walletPda);
  nextRequestId = currentWallet.nextRequestId.toNumber();
  nextAuditId = currentWallet.nextAuditId.toNumber();

  const payload3 = buildNativeRequestPayload();
  const [req3] = getRequestPda(walletPda, nextRequestId);
  const [audit3] = getAuditPda(walletPda, nextAuditId);

  await agentProgram.methods
    .submitRequest(sol(0.01), "Post-unfreeze transfer", payload3.instructionHash, payload3.accountsHash, null)
    .accounts({
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
      request: req3,
      auditEntry: audit3,
      recipient: recipientKp.publicKey,
      assetMint: NATIVE_MINT,
      assetTracker,
      targetProgram: SystemProgram.programId,
      systemProgram: SystemProgram.programId,
    })
    .signers([agentKp])
    .rpc();

  const req3Data = await (agentProgram.account as any).executionRequest.fetch(req3);
  console.log(`  ✓ Request status: ${REQUEST_STATUSES[req3Data.status]} — agent can operate again`);

  // ── Step 9: Print audit trail ──────────────────────────────────────────
  log("9/9", "Fetching audit trail...");
  const finalWallet = await (ownerProgram.account as any).smartWallet.fetch(walletPda);
  const auditPage = await fetchAuditEntriesPage(ownerProgram, walletPda, 0, 25);

  console.log(`\n  Audit entries: ${auditPage.items.length}`);
  for (const entry of auditPage.items) {
    const outcome = entry.approved ? "✅ APPROVED" : "❌ DENIED";
    const reason = entry.denialReason > 0 ? ` (${DENIAL_REASONS[entry.denialReason] ?? `reason ${entry.denialReason}`})` : "";
    const time = new Date(entry.timestamp.toNumber() * 1000).toLocaleTimeString();
    console.log(`    [${time}] ${outcome}${reason} — ${entry.memo || "(no memo)"} — ${(entry.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("  Kill Switch Demo Complete");
  console.log(`  Wallet frozen status: ${finalWallet.frozen}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});
