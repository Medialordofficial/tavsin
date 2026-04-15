/**
 * jupiter-swap.ts — Governed Jupiter swap through TavSin policy engine.
 *
 * Demonstrates how an AI agent can execute a Jupiter DEX swap
 * while remaining fully governed by the wallet owner's policy.
 *
 * Flow:
 *   1. Agent fetches a Jupiter quote (SOL → USDC)
 *   2. Agent decomposes the Jupiter swap instruction
 *   3. Agent submits a governed request through TavSin
 *   4. Owner approves the request
 *   5. Agent executes the swap via TavSin CPI
 *
 * On devnet: runs in simulation mode (shows governance flow, skips CPI)
 * On mainnet: executes real Jupiter swaps through TavSin governance
 *
 * Usage:
 *   npx tsx scripts/jupiter-swap.ts              # devnet simulation
 *   RPC_URL=<mainnet> npx tsx scripts/jupiter-swap.ts  # mainnet live
 */

import { BN, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  type VersionedTransaction as VTx,
} from "@solana/web3.js";
import fs from "node:fs";
import path from "node:path";

import idlJson from "../target/idl/tavsin.json";
import {
  buildRequestPayloadFromInstruction,
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
// Constants
// ---------------------------------------------------------------------------

const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const JUPITER_API = process.env.JUPITER_API ?? "https://lite-api.jup.ag/swap/v1";

// Well-known token mints
const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  const n =
    typeof lamports === "object" && "toNumber" in lamports
      ? lamports.toNumber()
      : Number(lamports);
  return (n / LAMPORTS_PER_SOL).toFixed(4);
}

function log(step: string, msg: string) {
  console.log(`\n[${step}] ${msg}`);
}

// ---------------------------------------------------------------------------
// Jupiter API
// ---------------------------------------------------------------------------

interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

interface JupiterSwapInstructions {
  swapInstruction: {
    programId: string;
    accounts: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
    data: string;
  };
  addressLookupTableAddresses: string[];
  computeBudgetInstructions: Array<{
    programId: string;
    accounts: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
    data: string;
  }>;
}

async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amountLamports: number,
  slippageBps = 100
): Promise<JupiterQuote> {
  const url = new URL(`${JUPITER_API}/quote`);
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amountLamports.toString());
  url.searchParams.set("slippageBps", slippageBps.toString());

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Jupiter quote failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<JupiterQuote>;
}

async function getJupiterSwapInstructions(
  quote: JupiterQuote,
  userPublicKey: string
): Promise<JupiterSwapInstructions> {
  const res = await fetch(`${JUPITER_API}/swap-instructions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Jupiter swap-instructions failed: ${res.status} ${await res.text()}`
    );
  }
  return res.json() as Promise<JupiterSwapInstructions>;
}

function jupiterIxToTransactionInstruction(
  ix: JupiterSwapInstructions["swapInstruction"]
): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(ix.programId),
    keys: ix.accounts.map((acc) => ({
      pubkey: new PublicKey(acc.pubkey),
      isSigner: acc.isSigner,
      isWritable: acc.isWritable,
    })),
    data: Buffer.from(ix.data, "base64"),
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  TavSin × Jupiter — Governed Swap Demo");
  console.log("=".repeat(60));

  const connection = new Connection(RPC_URL, "confirmed");
  const isDevnet = RPC_URL.includes("devnet");

  if (isDevnet) {
    console.log("\n⚠  Running in DEVNET SIMULATION mode");
    console.log("   Jupiter swaps only execute on mainnet.");
    console.log("   This demo shows the full governance flow.\n");
  }

  // ── Load keypairs ──────────────────────────────────────────────────────
  const ownerKp = loadKeypair("OWNER_KEY", "~/.config/solana/id.json");
  const agentKp = Keypair.generate(); // fresh agent per run
  const ownerWallet = walletFromKeypair(ownerKp);
  const agentWallet = walletFromKeypair(agentKp);

  log("SETUP", `Owner : ${ownerKp.publicKey.toBase58()}`);
  log("SETUP", `Agent : ${agentKp.publicKey.toBase58()}`);

  // Fund agent for rent
  const agentBalance = await connection.getBalance(agentKp.publicKey);
  if (agentBalance < 0.01 * LAMPORTS_PER_SOL) {
    log("SETUP", "Funding agent with 0.05 SOL from owner...");
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
    await new Promise((r) => setTimeout(r, 2000));
    log(
      "SETUP",
      `Agent funded: ${(
        (await connection.getBalance(agentKp.publicKey)) / LAMPORTS_PER_SOL
      ).toFixed(4)} SOL`
    );
  }

  // ── Step 1: Create smart wallet ────────────────────────────────────────
  log("1/6", "Creating smart wallet (allows Jupiter program)...");

  const ownerProgram = createProgram(idlJson as Idl, connection, ownerWallet);
  const agentProgram = createProgram(idlJson as Idl, connection, agentWallet);

  const [walletPda] = getWalletPda(ownerKp.publicKey, agentKp.publicKey);
  const [policyPda] = getPolicyPda(walletPda);
  const [legacyTrackerPda] = getLegacyTrackerPda(walletPda);

  // Jupiter v6 program ID
  const JUPITER_PROGRAM_ID = new PublicKey(
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
  );

  await ownerProgram.methods
    .createWallet(
      sol(1),  // max per tx: 1 SOL
      sol(5),  // daily budget: 5 SOL
      [SystemProgram.programId, JUPITER_PROGRAM_ID], // allow Jupiter
      null,
      null
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

  log("1/6", `Wallet created: ${walletPda.toBase58()}`);
  log("1/6", `Policy allows: SystemProgram + Jupiter`);

  // ── Step 2: Fund the wallet ────────────────────────────────────────────
  log("2/6", "Funding wallet with 0.2 SOL...");

  await ownerProgram.methods
    .fundWallet(sol(0.2))
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  log(
    "2/6",
    `Wallet balance: ${lamToSol(await connection.getBalance(walletPda))} SOL`
  );

  // ── Step 3: Get Jupiter quote ──────────────────────────────────────────
  log("3/6", "Fetching Jupiter quote: 0.1 SOL → USDC...");

  let jupiterQuote: JupiterQuote | null = null;
  let jupiterIx: TransactionInstruction | null = null;

  try {
    jupiterQuote = await getJupiterQuote(
      SOL_MINT,
      USDC_MINT,
      0.1 * LAMPORTS_PER_SOL
    );
    log("3/6", `Quote received:`);
    log("3/6", `  Input:  ${(Number(jupiterQuote.inAmount) / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    log("3/6", `  Output: ${(Number(jupiterQuote.outAmount) / 1e6).toFixed(2)} USDC`);
    log("3/6", `  Impact: ${jupiterQuote.priceImpactPct}%`);
    log(
      "3/6",
      `  Route:  ${jupiterQuote.routePlan
        .map((r) => r.swapInfo.label)
        .join(" → ")}`
    );

    // Get the actual swap instruction from Jupiter
    const swapIxData = await getJupiterSwapInstructions(
      jupiterQuote,
      walletPda.toBase58() // The wallet PDA is the "user" for the swap
    );

    jupiterIx = jupiterIxToTransactionInstruction(swapIxData.swapInstruction);
    log("3/6", `Swap instruction program: ${jupiterIx.programId.toBase58()}`);
    log("3/6", `Swap instruction accounts: ${jupiterIx.keys.length}`);
    log("3/6", `Swap instruction data: ${jupiterIx.data.length} bytes`);
  } catch (err: any) {
    log(
      "3/6",
      `Jupiter API unavailable (${err.message?.slice(0, 80)})`
    );
    log("3/6", "Using simulated swap instruction for governance demo...");
  }

  // ── Step 4: Submit governed swap request ───────────────────────────────
  log("4/6", "Agent submitting governed swap request through TavSin...");

  const walletState = await (ownerProgram.account as any).smartWallet.fetch(
    walletPda
  );
  const requestId = walletState.nextRequestId.toNumber();
  const auditId = walletState.nextAuditId.toNumber();

  const [requestPda] = getRequestPda(walletPda, requestId);
  const [submitAuditPda] = getAuditPda(walletPda, auditId);
  const [nativeTrackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);

  // Build the governed request payload
  // If we have a real Jupiter instruction, use it; otherwise use native payload
  let payload;
  let memo: string;
  let targetProgram: PublicKey;

  if (jupiterIx) {
    payload = buildRequestPayloadFromInstruction(jupiterIx, walletPda);
    memo = `Jupiter swap: ${(Number(jupiterQuote!.inAmount) / LAMPORTS_PER_SOL).toFixed(4)} SOL → ${(Number(jupiterQuote!.outAmount) / 1e6).toFixed(2)} USDC`;
    targetProgram = jupiterIx.programId;
  } else {
    // Simulated: use native transfer as stand-in
    payload = buildNativeRequestPayload();
    memo = "Simulated Jupiter swap: 0.1 SOL → ~14.25 USDC (devnet demo)";
    targetProgram = SystemProgram.programId;
  }

  const swapAmount = sol(0.1); // 0.1 SOL input

  await agentProgram.methods
    .submitRequest(
      swapAmount,
      memo,
      payload.instructionHash,
      payload.accountsHash,
      null
    )
    .accounts({
      agent: agentKp.publicKey,
      wallet: walletPda,
      policy: policyPda,
      request: requestPda,
      auditEntry: submitAuditPda,
      recipient: NATIVE_MINT, // Jupiter handles routing
      assetMint: NATIVE_MINT,
      assetTracker: nativeTrackerPda,
      targetProgram,
      systemProgram: SystemProgram.programId,
    })
    .signers([agentKp])
    .rpc();

  const request = await (agentProgram.account as any).executionRequest.fetch(
    requestPda
  );
  const isAutoApproved = request.status === 1;

  log("4/6", `Request #${requestId} submitted!`);
  log("4/6", `  Status: ${REQUEST_STATUSES[request.status]}`);
  log("4/6", `  Memo: "${request.memo}"`);
  log("4/6", `  Amount: ${lamToSol(request.amount)} SOL`);

  // ── Step 5: Owner approves (if pending) ────────────────────────────────
  if (isAutoApproved) {
    log("5/6", "Request auto-approved by policy (within limits) ✓");
  } else {
    log("5/6", "Owner approving swap request...");

    const ws2 = await (ownerProgram.account as any).smartWallet.fetch(
      walletPda
    );
    const [approveAuditPda] = getAuditPda(
      walletPda,
      ws2.nextAuditId.toNumber()
    );

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

    log("5/6", "Swap request approved ✓");
  }

  // ── Step 6: Agent executes (only possible on mainnet with real Jupiter) ─
  if (!isDevnet && jupiterIx) {
    log("6/6", "Agent executing governed Jupiter swap...");

    const ws3 = await (ownerProgram.account as any).smartWallet.fetch(
      walletPda
    );
    const [executeAuditPda] = getAuditPda(
      walletPda,
      ws3.nextAuditId.toNumber()
    );

    await agentProgram.methods
      .executeRequestWithPayload(Buffer.from(payload.instructionData))
      .accounts({
        agent: agentKp.publicKey,
        wallet: walletPda,
        policy: policyPda,
        request: requestPda,
        assetTracker: nativeTrackerPda,
        auditEntry: executeAuditPda,
        targetProgram: jupiterIx.programId,
        recipient: NATIVE_MINT,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(payload.remainingAccounts)
      .signers([agentKp])
      .rpc();

    log("6/6", "Jupiter swap executed through TavSin governance! ✓");
  } else if (isDevnet && !jupiterIx) {
    // Devnet simulation: execute the native transfer stand-in
    log("6/6", "Executing simulated swap on devnet...");

    const ws3 = await (ownerProgram.account as any).smartWallet.fetch(
      walletPda
    );
    const [executeAuditPda] = getAuditPda(
      walletPda,
      ws3.nextAuditId.toNumber()
    );

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
        recipient: NATIVE_MINT,
        systemProgram: SystemProgram.programId,
      })
      .signers([agentKp])
      .rpc();

    log("6/6", "Simulated swap executed ✓ (real CPI on mainnet)");
  } else {
    log(
      "6/6",
      "Skipping CPI execution (Jupiter programs not on devnet)"
    );
    log(
      "6/6",
      "On mainnet, this would execute the Jupiter swap through TavSin."
    );
  }

  // ── Audit trail ────────────────────────────────────────────────────────
  const auditPage = await fetchAuditEntriesPage(
    ownerProgram,
    walletPda,
    0,
    25
  );

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Swap Audit Trail (${auditPage.items.length} entries)`);
  console.log(`${"─".repeat(60)}`);

  for (const entry of auditPage.items) {
    const status = entry.approved ? "✔ APPROVED" : "✘ DENIED";
    const reason =
      DENIAL_REASONS[entry.denialReason] ?? `Code ${entry.denialReason}`;
    const ts = new Date(entry.timestamp.toNumber() * 1000).toISOString();

    console.log(
      `  ${status}  ${lamToSol(entry.amount)} SOL  ` +
        `reason=${reason}  ` +
        `memo="${entry.memo.slice(0, 50)}${entry.memo.length > 50 ? "..." : ""}"  ` +
        `${ts}`
    );
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    "  TavSin sovereign swap governance: Agent proposes → Policy checks →"
  );
  console.log("  Owner approves → Agent executes Jupiter swap via CPI");
  console.log(`${"=".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("\n❌ Failed:", err);
  process.exitCode = 1;
});
