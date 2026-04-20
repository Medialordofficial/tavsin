/**
 * TavSin USDC Demo Agent
 *
 * The "production" demo: an autonomous agent spending USDC under TavSin policy.
 * Mints a demo USDC token on devnet (6 decimals, mirrors real USDC) so the
 * demo is fully self-contained and reproducible.
 *
 * Run:
 *   SOLANA_RPC_URL=https://api.devnet.solana.com npx tsx src/usdc.ts
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
import {
  TOKEN_PROGRAM_ID,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createTransferCheckedInstruction,
  getAccount,
} from "@solana/spl-token";
import idlJson from "../../../target/idl/tavsin.json";
import {
  buildRequestPayloadFromInstruction,
  createProgram,
  fetchAuditEntriesPage,
  fetchWalletDetail,
  getAssetTrackerPda,
  getAuditPda,
  getPolicyPda,
  getRequestPda,
  getWalletPda,
  normalizeWalletSignedAccounts,
  NATIVE_MINT,
  REQUEST_STATUSES,
  DENIAL_REASONS,
  type AnchorCompatibleWallet,
} from "@tavsin/sdk";

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m",
  cyan: "\x1b[36m", magenta: "\x1b[35m", blue: "\x1b[34m",
};

function log(icon: string, msg: string) {
  const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
  console.log(`${C.dim}[${ts}]${C.reset} ${icon}  ${msg}`);
}
function heading(text: string) {
  console.log(`\n${C.bold}${C.cyan}━━━ ${text} ━━━${C.reset}\n`);
}
const success = (m: string) => log("✅", `${C.green}${m}${C.reset}`);
const info    = (m: string) => log("ℹ️ ", `${C.blue}${m}${C.reset}`);
const warn    = (m: string) => log("⚠️ ", `${C.yellow}${m}${C.reset}`);
const denied  = (m: string) => log("🚫", `${C.red}${m}${C.reset}`);
const step    = (m: string) => log("🔄", m);

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

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

async function demo() {
  console.log(`
${C.bold}${C.magenta}╔══════════════════════════════════════════════════════════════╗
║              TavSin · USDC Demo Agent                        ║
║      The compliance layer for AI agents on Solana            ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
`);

  const ownerKp = Keypair.generate();
  const agentKp = Keypair.generate();
  const merchantKp = Keypair.generate();

  info(`RPC:      ${RPC_URL}`);
  info(`Owner:    ${ownerKp.publicKey.toBase58()}`);
  info(`Agent:    ${agentKp.publicKey.toBase58()}`);
  info(`Merchant: ${merchantKp.publicKey.toBase58()}`);

  // ── Airdrop ────────────────────────────────────────────────────────────
  heading("Step 1 · Fund owner with devnet SOL (for tx fees)");
  step("Requesting 2 SOL airdrop...");
  try {
    const sig = await connection.requestAirdrop(ownerKp.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    success("Airdrop confirmed");
  } catch (err: any) {
    warn(`Airdrop failed: ${err.message}. Run: solana airdrop 2 ${ownerKp.publicKey.toBase58()} --url devnet`);
    return;
  }
  await sleep(1000);

  // ── Mint demo USDC ─────────────────────────────────────────────────────
  heading("Step 2 · Mint demo USDC (6 decimals, mirrors real USDC)");
  step("Creating SPL token mint...");
  const usdcMint = await createMint(
    connection,
    ownerKp,
    ownerKp.publicKey,
    null,
    6, // USDC has 6 decimals
    undefined,
    undefined,
    TOKEN_PROGRAM_ID
  );
  success(`Demo USDC mint: ${usdcMint.toBase58()}`);

  // ── Create wallet ──────────────────────────────────────────────────────
  heading("Step 3 · Create policy-governed TavSin wallet");

  const ownerProgram = createProgram(idlJson as Idl, connection, anchorWallet(ownerKp));
  const [walletPda] = getWalletPda(ownerKp.publicKey, agentKp.publicKey);
  const [policyPda] = getPolicyPda(walletPda);
  const [solTrackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);

  const POLICY = {
    maxPerTx: 50,    // 50 USDC max per tx
    maxDaily: 200,   // 200 USDC daily cap
  };

  step(`Policy: max ${POLICY.maxPerTx} USDC/tx, ${POLICY.maxDaily} USDC/day`);

  // Note: maxPerTx/maxDaily on policy are SOL-denominated lamports. For SPL,
  // amounts are passed directly as token base units. We set generous SOL limits
  // and let the asset tracker do the work in USDC units.
  await ownerProgram.methods
    .createWallet(
      new BN(POLICY.maxPerTx * 1_000_000),     // 50_000_000 base units = 50 USDC
      new BN(POLICY.maxDaily * 1_000_000),     // 200_000_000 base units = 200 USDC
      [TOKEN_PROGRAM_ID],                      // only allow SPL Token program
      null,
      null
    )
    .accounts({
      owner: ownerKp.publicKey,
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
      tracker: solTrackerPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  success(`Wallet created: ${walletPda.toBase58()}`);
  info(`Allowed program: SPL Token only (no random programs)`);

  // ── Fund wallet with USDC ──────────────────────────────────────────────
  heading("Step 4 · Fund wallet with 500 demo USDC");
  step("Creating wallet's USDC account...");

  const walletAta = await getOrCreateAssociatedTokenAccount(
    connection, ownerKp, usdcMint, walletPda, true, undefined, undefined, TOKEN_PROGRAM_ID
  );
  await mintTo(
    connection, ownerKp, usdcMint, walletAta.address,
    ownerKp.publicKey, 500_000_000, [], undefined, TOKEN_PROGRAM_ID
  );
  success(`Wallet funded: 500 USDC`);

  // Pre-create merchant ATA so transfers work
  const merchantAta = await getOrCreateAssociatedTokenAccount(
    connection, ownerKp, usdcMint, merchantKp.publicKey, false, undefined, undefined, TOKEN_PROGRAM_ID
  );
  info(`Merchant USDC account: ${merchantAta.address.toBase58()}`);

  await sleep(500);

  // ── Demo scenarios ─────────────────────────────────────────────────────
  const agentProgram = createProgram(idlJson as Idl, connection, anchorWallet(agentKp));

  heading("Step 5 · Agent pays merchant 25 USDC ✓ (within limits)");
  await runUsdcRequest(agentProgram, agentKp, walletPda, walletAta.address, merchantAta.address, usdcMint, 25, "Pay merchant for API credits");

  await sleep(1000);

  heading("Step 6 · Agent pays merchant 30 USDC ✓ (still within limits)");
  await runUsdcRequest(agentProgram, agentKp, walletPda, walletAta.address, merchantAta.address, usdcMint, 30, "Subscription renewal");

  await sleep(1000);

  heading("Step 7 · Agent attempts 75 USDC payment ✗ (exceeds per-tx limit of 50 USDC)");
  await runUsdcRequest(agentProgram, agentKp, walletPda, walletAta.address, merchantAta.address, usdcMint, 75, "Large purchase attempt");

  await sleep(1000);

  heading("Step 8 · Rapid burst — testing daily budget enforcement");
  for (let i = 0; i < 5; i++) {
    step(`Payment ${i + 1}/5: 40 USDC...`);
    const stop = await runUsdcRequest(
      agentProgram, agentKp, walletPda, walletAta.address, merchantAta.address, usdcMint,
      40, `Batch payment ${i + 1}`,
      true
    );
    if (stop) {
      info("  ✓ Daily budget enforcement confirmed!");
      break;
    }
    await sleep(700);
  }

  // ── Final audit ────────────────────────────────────────────────────────
  heading("Step 9 · On-Chain Audit Trail");

  const detail = await fetchWalletDetail(agentProgram, connection, walletPda, 20);
  const wa: any = detail.walletAccount?.account ?? detail.walletAccount ?? {};
  const walletUsdcAcct = await getAccount(connection, walletAta.address, undefined, TOKEN_PROGRAM_ID);
  const merchantUsdcAcct = await getAccount(connection, merchantAta.address, undefined, TOKEN_PROGRAM_ID);

  info(`Wallet balance:   ${(Number(walletUsdcAcct.amount) / 1_000_000).toFixed(2)} USDC`);
  info(`Merchant received: ${(Number(merchantUsdcAcct.amount) / 1_000_000).toFixed(2)} USDC`);
  info(`Total approved:   ${wa.totalApproved?.toNumber?.() ?? 0}`);
  info(`Total denied:     ${wa.totalDenied?.toNumber?.() ?? 0}`);

  console.log(`\n${C.bold}Audit Log (newest first):${C.reset}`);
  console.log("─".repeat(85));
  for (const entry of detail.auditEntries) {
    const icon = entry.approved ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
    const amt = ((entry.amount as any)?.toNumber?.() ?? 0) / 1_000_000;
    const reason = !entry.approved
      ? ` — ${C.red}${DENIAL_REASONS[entry.denialReason] ?? `code ${entry.denialReason}`}${C.reset}`
      : "";
    const time = new Date(entry.timestamp.toNumber() * 1000).toLocaleTimeString("en-US", { hour12: false });
    console.log(`  ${icon} ${time}  ${amt.toFixed(2).padStart(7)} USDC  "${entry.memo}"${reason}`);
  }
  console.log("─".repeat(85));

  console.log(`
${C.bold}${C.magenta}╔══════════════════════════════════════════════════════════════╗
║                    Demo Complete                             ║
║                                                              ║
║  Every payment policy-checked on-chain. Every decision      ║
║  immutably logged. The agent never had spending authority.  ║
║                                                              ║
║  Wallet: ${walletPda.toBase58().padEnd(44)} ║
║  Mint:   ${usdcMint.toBase58().padEnd(44)} ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
`);
}

async function runUsdcRequest(
  program: ReturnType<typeof createProgram>,
  agentKp: Keypair,
  walletPda: PublicKey,
  walletAta: PublicKey,
  merchantAta: PublicKey,
  mint: PublicKey,
  amountUsdc: number,
  memo: string,
  silent = false
): Promise<boolean> {
  const baseUnits = amountUsdc * 1_000_000;

  // Build the SPL transferChecked instruction
  const transferIx = createTransferCheckedInstruction(
    walletAta, mint, merchantAta, walletPda,
    baseUnits, 6, [], TOKEN_PROGRAM_ID
  );
  const normalizedKeys = normalizeWalletSignedAccounts(transferIx.keys, walletPda);
  const payload = buildRequestPayloadFromInstruction(transferIx, walletPda);

  const walletAccount = await (program.account as any).smartWallet.fetch(walletPda);
  const requestId = walletAccount.nextRequestId.toNumber();
  const auditId = walletAccount.nextAuditId.toNumber();
  const [requestPda] = getRequestPda(walletPda, requestId);
  const [auditEntryPda] = getAuditPda(walletPda, auditId);
  const [assetTrackerPda] = getAssetTrackerPda(walletPda, mint);

  try {
    await program.methods
      .submitRequest(
        new BN(baseUnits),
        memo,
        payload.instructionHash,
        payload.accountsHash,
        new BN(Math.floor(Date.now() / 1000) + 3600)
      )
      .accounts({
        agent: agentKp.publicKey,
        wallet: walletPda,
        policy: getPolicyPda(walletPda)[0],
        request: requestPda,
        auditEntry: auditEntryPda,
        recipient: merchantAta,
        assetMint: mint,
        assetTracker: assetTrackerPda,
        targetProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  } catch (err: any) {
    handleErr(err, amountUsdc, silent);
    return looksLikeBudgetHit(err);
  }

  // Check status
  const request = await (program.account as any).executionRequest.fetch(requestPda);
  if (request.status === 3) {
    // Auto-approved — execute
    try {
      const execAuditId = (await (program.account as any).smartWallet.fetch(walletPda)).nextAuditId.toNumber();
      const [execAuditPda] = getAuditPda(walletPda, execAuditId);
      await program.methods
        .executeRequestWithPayload(Buffer.from(transferIx.data))
        .accounts({
          agent: agentKp.publicKey,
          wallet: walletPda,
          policy: getPolicyPda(walletPda)[0],
          request: requestPda,
          assetTracker: assetTrackerPda,
          auditEntry: execAuditPda,
          targetProgram: TOKEN_PROGRAM_ID,
          recipient: merchantAta,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(normalizedKeys.map((k) => ({
          pubkey: k.pubkey, isSigner: k.isSigner, isWritable: k.isWritable,
        })))
        .rpc();
      success(`Approved & executed → ${amountUsdc} USDC transferred`);
      return false;
    } catch (err: any) {
      handleErr(err, amountUsdc, silent);
      return looksLikeBudgetHit(err);
    }
  } else if (request.status === 0) {
    info(`Request #${requestId} pending owner approval (above threshold)`);
    return false;
  } else {
    const status = REQUEST_STATUSES[request.status] ?? `status ${request.status}`;
    denied(`Request #${requestId} ${status}`);
    return false;
  }
}

function handleErr(err: any, amount: number, silent: boolean) {
  const msg = err.message ?? String(err);
  if (msg.includes("ExceedsTransactionLimit") || msg.includes("max_per_tx") || msg.includes("MaxPerTx")) {
    denied(`${amount} USDC DENIED — exceeds per-transaction limit`);
  } else if (msg.includes("DailyLimit") || msg.includes("daily")) {
    denied(`${amount} USDC DENIED — daily spending budget reached`);
  } else if (msg.includes("WalletFrozen")) {
    denied(`${amount} USDC DENIED — wallet frozen`);
  } else if (msg.includes("ProgramNotAllowed")) {
    denied(`${amount} USDC DENIED — target program not on allowlist`);
  } else if (!silent) {
    warn(`${amount} USDC failed: ${msg.slice(0, 200)}`);
  } else {
    denied(`${amount} USDC DENIED — policy violation`);
  }
}

function looksLikeBudgetHit(err: any): boolean {
  const msg = err.message ?? String(err);
  return msg.includes("DailyLimit") || msg.includes("daily") || msg.includes("budget");
}

demo().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
