/**
 * agent-bot.ts — Example agent bot that demonstrates the full TavSin
 * governed request flow on Solana devnet.
 *
 * Flow:
 *   1. Owner creates a smart wallet with an agent key
 *   2. Owner funds the wallet with SOL
 *   3. Agent submits a native SOL transfer request
 *   4. Owner approves the request
 *   5. Agent executes the approved request
 *   6. Prints the audit trail
 *
 * Usage:
 *   OWNER_KEY=~/.config/solana/id.json \
 *   AGENT_KEY=/tmp/test-agent.json \
 *     npx ts-node --esm scripts/agent-bot.ts
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
  PROGRAM_ID,
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
    async signTransaction<T extends Transaction | VersionedTransaction>(
      tx: T
    ): Promise<T> {
      if (tx instanceof Transaction) {
        tx.partialSign(kp);
      }
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> {
      for (const tx of txs) {
        if (tx instanceof Transaction) {
          tx.partialSign(kp);
        }
      }
      return txs;
    },
  };
}

function sol(n: number): BN {
  return new BN(Math.floor(n * LAMPORTS_PER_SOL));
}

function lamToSol(lamports: number | bigint | BN): string {
  const n = typeof lamports === "object" && "toNumber" in lamports
    ? lamports.toNumber()
    : Number(lamports);
  return (n / LAMPORTS_PER_SOL).toFixed(4);
}

function log(step: string, msg: string) {
  console.log(`\n[${ step }] ${ msg }`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  TavSin Agent Bot — Devnet E2E Demo");
  console.log("=".repeat(60));

  const connection = new Connection(RPC_URL, "confirmed");

  // ── Load keypairs ──────────────────────────────────────────────────────
  const ownerKp = loadKeypair(
    "OWNER_KEY",
    "~/.config/solana/id.json"
  );
  // Generate a fresh agent each run so wallets are always new
  const agentKp = process.env.AGENT_KEY
    ? loadKeypair("AGENT_KEY", "/tmp/test-agent.json")
    : Keypair.generate();
  const recipient = Keypair.generate();

  log("SETUP", `Owner  : ${ownerKp.publicKey.toBase58()}`);
  log("SETUP", `Agent  : ${agentKp.publicKey.toBase58()}`);
  log("SETUP", `Target : ${recipient.publicKey.toBase58()} (ephemeral)`);

  // ── Ensure agent has SOL for rent on init accounts ─────────────────────
  const agentBalance = await connection.getBalance(agentKp.publicKey);
  if (agentBalance < 0.01 * LAMPORTS_PER_SOL) {
    log("SETUP", "Agent needs SOL — transferring 0.05 SOL from owner...");
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: ownerKp.publicKey,
        toPubkey: agentKp.publicKey,
        lamports: 0.05 * LAMPORTS_PER_SOL,
      })
    );
    tx.feePayer = ownerKp.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.sign(ownerKp);
    await connection.sendRawTransaction(tx.serialize());
    await new Promise((r) => setTimeout(r, 2000)); // wait for confirmation
    log("SETUP", `Agent funded: ${(await connection.getBalance(agentKp.publicKey) / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  } else {
    log("SETUP", `Agent balance: ${(agentBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  }

  // ── Step 1: Create wallet ──────────────────────────────────────────────
  log("1/7", "Creating smart wallet with policy...");

  const ownerWallet = walletFromKeypair(ownerKp);
  const ownerProgram = createProgram(idlJson as Idl, connection, ownerWallet);

  const [walletPda] = getWalletPda(ownerKp.publicKey, agentKp.publicKey);
  const [policyPda] = getPolicyPda(walletPda);
  const [legacyTrackerPda] = getLegacyTrackerPda(walletPda);
  const [nativeTrackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);

  try {
    await ownerProgram.methods
      .createWallet(
        sol(0.5),             // max per tx: 0.5 SOL
        sol(2),               // daily budget: 2 SOL
        [SystemProgram.programId], // allowed programs
        null,                 // time window start
        null                  // time window end
      )
      .accounts({
        owner: ownerKp.publicKey,
        agent: agentKp.publicKey,
        wallet: walletPda,
        policy: policyPda,
        tracker: legacyTrackerPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    log("1/7", `Wallet created: ${walletPda.toBase58()}`);
  } catch (err: any) {
    if (err?.message?.includes("already in use")) {
      log("1/7", `Wallet already exists: ${walletPda.toBase58()}`);
    } else {
      throw err;
    }
  }

  // ── Step 2: Fund the wallet ────────────────────────────────────────────
  log("2/7", "Funding wallet with 0.1 SOL...");

  await ownerProgram.methods
    .fundWallet(sol(0.1))
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const balAfterFund = await connection.getBalance(walletPda);
  log("2/7", `Wallet balance: ${lamToSol(balAfterFund)} SOL`);

  // ── Step 3: Set an approval threshold ──────────────────────────────────
  log("3/7", "Setting approval threshold to 0.04 SOL (requests above require owner approval)...");

  await ownerProgram.methods
    .updatePolicy(
      null,                   // max per tx (keep)
      null,                   // max daily (keep)
      sol(0.04),              // approval threshold: 0.04 SOL
      null,                   // require approval for new recipients (keep)
      null,                   // allowed programs (keep)
      null,                   // allowed recipients (keep)
      null,                   // blocked mints (keep)
      null,                   // mint rules (keep)
      null,                   // time window start (keep)
      null                    // time window end (keep),
        null,
        null
    )
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
    })
    .rpc();

  log("3/7", "Approval threshold set — requests > 0.04 SOL need manual approval");

  // ── Step 4: Agent submits a native SOL request (above threshold → pending) ─
  log("4/7", "Agent submitting 0.05 SOL transfer request (above threshold → will pend)...");

  const agentWallet = walletFromKeypair(agentKp);
  const agentProgram = createProgram(idlJson as Idl, connection, agentWallet);

  // Fetch wallet state for current IDs
  const walletState = await (ownerProgram.account as any).smartWallet.fetch(walletPda);
  const requestId = walletState.nextRequestId.toNumber();
  const auditId = walletState.nextAuditId.toNumber();

  const [requestPda] = getRequestPda(walletPda, requestId);
  const [submitAuditPda] = getAuditPda(walletPda, auditId);
  const payload = buildNativeRequestPayload();

  await agentProgram.methods
    .submitRequest(
      sol(0.05),
      "Bot demo: pay vendor for API credits",
      payload.instructionHash,
      payload.accountsHash,
      null // no expiry
    )
    .accounts({
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
      request: requestPda,
      auditEntry: submitAuditPda,
      recipient: recipient.publicKey,
      assetMint: NATIVE_MINT,
      assetTracker: nativeTrackerPda,
      targetProgram: SystemProgram.programId,
      systemProgram: SystemProgram.programId,
    })
    .signers([agentKp])
    .rpc();

  const requestAccount = await (agentProgram.account as any).executionRequest.fetch(requestPda);
  log("4/7", `Request #${requestId} status: ${REQUEST_STATUSES[requestAccount.status]} (${requestAccount.status})`);
  log("4/7", `  Memo: "${requestAccount.memo}"`);
  log("4/7", `  Amount: ${lamToSol(requestAccount.amount)} SOL`);

  // ── Step 5: Owner approves the request ─────────────────────────────────
  log("5/7", "Owner approving request...");

  const walletState2 = await (ownerProgram.account as any).smartWallet.fetch(walletPda);
  const [approveAuditPda] = getAuditPda(walletPda, walletState2.nextAuditId.toNumber());

  await ownerProgram.methods
    .approveRequest()
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
      request: requestPda,
      auditEntry: approveAuditPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const afterApprove = await (agentProgram.account as any).executionRequest.fetch(requestPda);
  log("5/7", `Request #${requestId} status: ${REQUEST_STATUSES[afterApprove.status]}`);

  // ── Step 6: Agent executes the approved request ────────────────────────
  log("6/7", "Agent executing approved request...");

  const walletState3 = await (ownerProgram.account as any).smartWallet.fetch(walletPda);
  const [executeAuditPda] = getAuditPda(walletPda, walletState3.nextAuditId.toNumber());

  const recipientBefore = await connection.getBalance(recipient.publicKey);

  await agentProgram.methods
    .executeRequest()
    .accounts({
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
      request: requestPda,
      assetTracker: nativeTrackerPda,
      auditEntry: executeAuditPda,
      targetProgram: SystemProgram.programId,
      recipient: recipient.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([agentKp])
    .rpc();

  const recipientAfter = await connection.getBalance(recipient.publicKey);
  const walletBalAfter = await connection.getBalance(walletPda);

  log("6/7", `Request #${requestId} executed!`);
  log("6/7", `  Recipient received: ${lamToSol(recipientAfter - recipientBefore)} SOL`);
  log("6/7", `  Wallet balance now: ${lamToSol(walletBalAfter)} SOL`);

  // ── Step 7: Print audit trail ──────────────────────────────────────────
  log("7/7", "Fetching audit trail...");

  const auditPage = await fetchAuditEntriesPage(ownerProgram, walletPda, 0, 25);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Audit Trail (${auditPage.items.length} entries)`);
  console.log(`${"─".repeat(60)}`);

  for (const entry of auditPage.items) {
    const status = entry.approved ? "✔ APPROVED" : "✘ DENIED";
    const reason = DENIAL_REASONS[entry.denialReason] ?? `Code ${entry.denialReason}`;
    const ts = new Date(entry.timestamp.toNumber() * 1000).toISOString();

    console.log(
      `  ${status}  ${lamToSol(entry.amount)} SOL  ` +
      `reason=${reason}  ` +
      `memo="${entry.memo}"  ` +
      `${ts}`
    );
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("  Demo complete — all steps executed on devnet");
  console.log(`${"=".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("\n❌ Bot failed:", err);
  process.exitCode = 1;
});
