/**
 * TavSin Live Demo Agent
 *
 * Autonomous agent that demonstrates TavSin's policy enforcement on devnet.
 * Run this during your pitch — it creates a wallet, makes requests, hits
 * policy limits, and shows the audit trail live.
 *
 * Usage:
 *   SOLANA_RPC_URL=https://api.devnet.solana.com npx tsx src/index.ts
 *
 * The agent keypair is auto-generated for the demo. Fund the wallet with
 * devnet SOL to see real transactions.
 */

import { type Idl } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import idlJson from "../../../target/idl/tavsin.json";
import {
  buildNativeRequestPayload,
  createProgram,
  fetchAuditEntriesPage,
  fetchWalletDetail,
  getAssetTrackerPda,
  getAuditPda,
  getPolicyPda,
  getRequestPda,
  getWalletPda,
  NATIVE_MINT,
  PROGRAM_ID,
  REQUEST_STATUSES,
  DENIAL_REASONS,
  type AnchorCompatibleWallet,
} from "@tavsin/sdk";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

function log(icon: string, msg: string) {
  const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`${COLORS.dim}[${ts}]${COLORS.reset} ${icon}  ${msg}`);
}

function heading(text: string) {
  console.log(`\n${COLORS.bold}${COLORS.cyan}━━━ ${text} ━━━${COLORS.reset}\n`);
}

function success(msg: string) { log("✅", `${COLORS.green}${msg}${COLORS.reset}`); }
function info(msg: string)    { log("ℹ️ ", `${COLORS.blue}${msg}${COLORS.reset}`); }
function warn(msg: string)    { log("⚠️ ", `${COLORS.yellow}${msg}${COLORS.reset}`); }
function denied(msg: string)  { log("🚫", `${COLORS.red}${msg}${COLORS.reset}`); }
function step(msg: string)    { log("🔄", msg); }

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function anchorWallet(kp: Keypair): AnchorCompatibleWallet {
  return {
    publicKey: kp.publicKey,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if (tx instanceof Transaction) tx.sign(kp);
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
      txs.forEach((tx) => { if (tx instanceof Transaction) tx.sign(kp); });
      return txs;
    },
  };
}

// ---------------------------------------------------------------------------
// Demo Scenarios
// ---------------------------------------------------------------------------

async function demo() {
  console.log(`
${COLORS.bold}${COLORS.magenta}╔══════════════════════════════════════════════════════════════╗
║                  TavSin Live Demo Agent                      ║
║          Policy-Enforced Smart Wallets for AI Agents         ║
╚══════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

  // Generate fresh keypairs for the demo
  const ownerKp = Keypair.generate();
  const agentKp = Keypair.generate();
  const recipientKp = Keypair.generate();

  info(`RPC:       ${RPC_URL}`);
  info(`Owner:     ${ownerKp.publicKey.toBase58()}`);
  info(`Agent:     ${agentKp.publicKey.toBase58()}`);
  info(`Recipient: ${recipientKp.publicKey.toBase58()}`);

  // ── Step 1: Airdrop SOL ───────────────────────────────────────────────
  heading("Step 1 · Fund the owner with devnet SOL");

  step("Requesting airdrop of 2 SOL...");
  try {
    const airdropSig = await connection.requestAirdrop(
      ownerKp.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSig, "confirmed");
    success("Airdrop confirmed — owner has 2 SOL");
  } catch (err: any) {
    warn(`Airdrop failed (${err.message}). Continuing with existing balance...`);
  }

  await sleep(1000);

  const ownerProgram = createProgram(
    idlJson as Idl,
    connection,
    anchorWallet(ownerKp)
  );

  // ── Step 2: Create governed wallet ────────────────────────────────────
  heading("Step 2 · Create a policy-governed wallet");

  const [walletPda] = getWalletPda(ownerKp.publicKey, agentKp.publicKey);
  const [policyPda] = getPolicyPda(walletPda);
  const [trackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);

  const MAX_PER_TX = 0.1;  // SOL
  const MAX_DAILY  = 0.5;  // SOL

  step(`Creating wallet with policy: max ${MAX_PER_TX} SOL/tx, ${MAX_DAILY} SOL/day`);

  try {
    await ownerProgram.methods
      .createWallet(
        new BN(Math.floor(MAX_PER_TX * LAMPORTS_PER_SOL)),
        new BN(Math.floor(MAX_DAILY * LAMPORTS_PER_SOL)),
        [],    // allowed programs — empty = allow all
        null,  // no time window start
        null   // no time window end
      )
      .accounts({
        owner: ownerKp.publicKey,
        agent: agentKp.publicKey,
        wallet: walletPda,
        policy: policyPda,
        tracker: trackerPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    success(`Wallet created: ${walletPda.toBase58()}`);
    info(`Policy → max per tx: ${MAX_PER_TX} SOL, daily limit: ${MAX_DAILY} SOL`);
  } catch (err: any) {
    warn(`Wallet creation failed: ${err.message}`);
    return;
  }

  await sleep(500);

  // ── Step 3: Fund the wallet ───────────────────────────────────────────
  heading("Step 3 · Fund the smart wallet");

  step("Transferring 1 SOL to the wallet...");
  try {
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: ownerKp.publicKey,
        toPubkey: walletPda,
        lamports: 1 * LAMPORTS_PER_SOL,
      })
    );
    tx.feePayer = ownerKp.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.sign(ownerKp);
    const fundSig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(fundSig, "confirmed");
    success("Wallet funded with 1 SOL");
  } catch (err: any) {
    warn(`Funding failed: ${err.message}`);
    return;
  }

  await sleep(500);

  // Now switch to agent signing
  const agentProgram = createProgram(
    idlJson as Idl,
    connection,
    anchorWallet(agentKp)
  );

  // ── Step 4: Small request → should auto-approve ──────────────────────
  heading("Step 4 · Agent requests 0.05 SOL (within limits → auto-approved)");

  try {
    const result = await submitAgentRequest(agentProgram, agentKp, walletPda, recipientKp.publicKey, 0.05, "Buy coffee for the team");
    if (result.approved) {
      success(`Request #${result.requestId} AUTO-APPROVED — 0.05 SOL transferred!`);
    } else {
      info(`Request #${result.requestId} status: ${result.status}`);
    }
  } catch (err: any) {
    handleRequestError(err, 0.05);
  }

  await sleep(1000);

  // ── Step 5: Another small request → works fine ────────────────────────
  heading("Step 5 · Agent requests 0.08 SOL (still within limits)");

  try {
    const result = await submitAgentRequest(agentProgram, agentKp, walletPda, recipientKp.publicKey, 0.08, "Purchase API credits");
    if (result.approved) {
      success(`Request #${result.requestId} AUTO-APPROVED — 0.08 SOL transferred!`);
    } else {
      info(`Request #${result.requestId} status: ${result.status}`);
    }
  } catch (err: any) {
    handleRequestError(err, 0.08);
  }

  await sleep(1000);

  // ── Step 6: Over per-tx limit → denied ────────────────────────────────
  heading("Step 6 · Agent requests 0.2 SOL (EXCEEDS per-tx limit of 0.1 SOL)");

  try {
    const result = await submitAgentRequest(agentProgram, agentKp, walletPda, recipientKp.publicKey, 0.2, "Big purchase attempt");
    if (result.approved) {
      warn(`Unexpectedly approved — request #${result.requestId}`);
    } else {
      denied(`Request #${result.requestId} DENIED — ${result.status}`);
      info("Policy enforcement working: amount exceeds per-transaction limit!");
    }
  } catch (err: any) {
    handleRequestError(err, 0.2);
  }

  await sleep(1000);

  // ── Step 7: Rapid requests to approach daily limit ────────────────────
  heading("Step 7 · Rapid requests to test daily budget enforcement");

  for (let i = 0; i < 5; i++) {
    const amount = 0.09;
    step(`Request ${i + 1}/5: ${amount} SOL...`);
    try {
      const result = await submitAgentRequest(
        agentProgram, agentKp, walletPda, recipientKp.publicKey,
        amount, `Batch request ${i + 1}`
      );
      if (result.approved) {
        success(`  ✓ Auto-approved (total spent increasing...)`);
      } else {
        denied(`  ✗ DENIED — ${result.status} (daily budget hit!)`);
        info("  Policy enforcement working: daily spending limit reached!");
        break;
      }
    } catch (err: any) {
      handleRequestError(err, amount);
      if (err.message?.includes("daily") || err.message?.includes("budget") || err.message?.includes("DailyLimitExceeded")) {
        info("  Daily budget enforcement confirmed!");
        break;
      }
    }
    await sleep(800);
  }

  // ── Step 8: Show final audit trail ────────────────────────────────────
  heading("Step 8 · Final Audit Trail");

  try {
    const detail = await fetchWalletDetail(agentProgram, connection, walletPda, 20);
    const balance = await connection.getBalance(walletPda);
    const wa: any = detail.walletAccount?.account ?? detail.walletAccount ?? {};

    info(`Wallet balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    info(`Total approved: ${wa.totalApproved?.toNumber?.() ?? 0}`);
    info(`Total denied:   ${wa.totalDenied?.toNumber?.() ?? 0}`);
    info(`Pending:        ${wa.totalPending?.toNumber?.() ?? 0}`);

    if (detail.nativeAssetTracker) {
      const spent = (detail.nativeAssetTracker.spentInPeriod as any)?.toNumber?.() ?? 0;
      info(`Spent today:    ${(spent / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    }

    console.log(`\n${COLORS.bold}Audit Log:${COLORS.reset}`);
    console.log("─".repeat(80));
    for (const entry of detail.auditEntries) {
      const icon = entry.approved ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.red}✗${COLORS.reset}`;
      const amt = ((entry.amount as any)?.toNumber?.() ?? 0) / LAMPORTS_PER_SOL;
      const amount = amt.toFixed(4);
      const reason = !entry.approved
        ? ` — ${COLORS.red}${DENIAL_REASONS[entry.denialReason] ?? `code ${entry.denialReason}`}${COLORS.reset}`
        : "";
      const time = new Date(entry.timestamp.toNumber() * 1000).toLocaleTimeString("en-US", { hour12: false });
      console.log(`  ${icon} ${time}  ${amount} SOL  "${entry.memo}"${reason}`);
    }
    console.log("─".repeat(80));
  } catch (err: any) {
    warn(`Could not fetch audit trail: ${err.message}`);
  }

  // ── Done ──────────────────────────────────────────────────────────────
  console.log(`
${COLORS.bold}${COLORS.magenta}╔══════════════════════════════════════════════════════════════╗
║                    Demo Complete!                            ║
║                                                              ║
║  TavSin enforced per-tx limits, daily budgets, and created  ║
║  a full on-chain audit trail — all autonomously.            ║
║                                                              ║
║  Dashboard: https://tavsin.xyz/dashboard                     ║
║  Wallet:    ${walletPda.toBase58()}  ║
╚══════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function submitAgentRequest(
  program: ReturnType<typeof createProgram>,
  agentKp: Keypair,
  walletPda: PublicKey,
  recipient: PublicKey,
  amountSol: number,
  memo: string
) {
  const walletAccount = await (program.account as any).smartWallet.fetch(walletPda);
  const requestId = walletAccount.nextRequestId.toNumber();
  const auditId = walletAccount.nextAuditId.toNumber();
  const [requestPda] = getRequestPda(walletPda, requestId);
  const [auditEntryPda] = getAuditPda(walletPda, auditId);
  const [assetTrackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);
  const payload = buildNativeRequestPayload();
  const expiresAt = new BN(Math.floor(Date.now() / 1000) + 3600);

  await program.methods
    .submitRequest(
      new BN(Math.floor(amountSol * LAMPORTS_PER_SOL)),
      memo,
      payload.instructionHash,
      payload.accountsHash,
      expiresAt
    )
    .accounts({
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: getPolicyPda(walletPda)[0],
      request: requestPda,
      auditEntry: auditEntryPda,
      recipient,
      assetMint: NATIVE_MINT,
      assetTracker: assetTrackerPda,
      targetProgram: payload.targetProgram,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const request = await (program.account as any).executionRequest.fetch(requestPda);
  const status = REQUEST_STATUSES[request.status] ?? `status ${request.status}`;
  const approved = request.status === 3; // Executed = auto-approved

  return { requestId, requestPda, status, approved };
}

function handleRequestError(err: any, amountSol: number) {
  const msg = err.message ?? String(err);
  if (msg.includes("ExceedsTransactionLimit") || msg.includes("max_per_tx")) {
    denied(`Request for ${amountSol} SOL DENIED — exceeds per-transaction limit`);
  } else if (msg.includes("DailyLimitExceeded") || msg.includes("daily")) {
    denied(`Request for ${amountSol} SOL DENIED — daily spending limit reached`);
  } else if (msg.includes("OutsideTimeWindow")) {
    denied(`Request for ${amountSol} SOL DENIED — outside allowed time window`);
  } else if (msg.includes("WalletFrozen")) {
    denied(`Request for ${amountSol} SOL DENIED — wallet is frozen`);
  } else {
    warn(`Request failed: ${msg.slice(0, 200)}`);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

demo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
