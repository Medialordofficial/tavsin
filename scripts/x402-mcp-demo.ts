/**
 * x402-mcp-demo.ts — Demonstrates TavSin-governed MCP tool payments
 *
 * Scenario:
 *   An AI agent uses MCP tool servers (weather API, search API, code
 *   generation). Each tool call costs SOL. TavSin enforces per-call
 *   limits — the agent can't overspend on any single tool, and total
 *   daily spending is capped.
 *
 * Flow:
 *   1. Owner creates a wallet with micro-payment policy (0.01 SOL/tx, 0.05 SOL/day)
 *   2. Owner funds the wallet
 *   3. Agent pays for "weather-api" MCP tool call (0.005 SOL) → approved
 *   4. Agent pays for "search-api" MCP tool call (0.008 SOL) → approved
 *   5. Agent tries to pay 0.02 SOL (exceeds per-tx limit) → denied
 *   6. Agent makes 3 more valid calls to approach daily cap
 *   7. Print audit trail showing all governed payments
 *
 * Usage:
 *   npx tsx scripts/x402-mcp-demo.ts
 */

import { BN, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
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
      if (tx instanceof Transaction) tx.partialSign(kp);
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> {
      for (const tx of txs) {
        if (tx instanceof Transaction) tx.partialSign(kp);
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
  return (n / LAMPORTS_PER_SOL).toFixed(6);
}

function log(step: string, msg: string) {
  console.log(`\n[${step}] ${msg}`);
}

// Simulated MCP tool vendors
const MCP_TOOLS = [
  { name: "weather-api", costSol: 0.005, desc: "Get weather forecast" },
  { name: "search-api", costSol: 0.008, desc: "Web search query" },
  { name: "code-gen", costSol: 0.02, desc: "Generate code snippet" }, // will exceed per-tx
  { name: "translate-api", costSol: 0.004, desc: "Translate text" },
  { name: "image-api", costSol: 0.006, desc: "Generate image" },
  { name: "embed-api", costSol: 0.003, desc: "Create embeddings" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(64));
  console.log("  TavSin x402 MCP Tool Payment Demo");
  console.log("  Governed micro-payments for AI agent tool calls");
  console.log("=".repeat(64));

  const connection = new Connection(RPC_URL, "confirmed");

  const ownerKp = loadKeypair("OWNER_KEY", "~/.config/solana/id.json");
  const agentKp = Keypair.generate();
  // Simulated MCP tool vendor receiving payments
  const vendorKp = Keypair.generate();

  log("SETUP", `Owner  : ${ownerKp.publicKey.toBase58()}`);
  log("SETUP", `Agent  : ${agentKp.publicKey.toBase58()}`);
  log("SETUP", `Vendor : ${vendorKp.publicKey.toBase58()} (MCP tool provider)`);

  // Fund agent for rent
  const agentBal = await connection.getBalance(agentKp.publicKey);
  if (agentBal < 0.01 * LAMPORTS_PER_SOL) {
    log("SETUP", "Funding agent for account rent...");
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
    const sig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    log("SETUP", "Agent funded ✓");
  }

  // PDAs
  const [walletPda] = getWalletPda(ownerKp.publicKey, agentKp.publicKey);
  const [policyPda] = getPolicyPda(walletPda);
  const [legacyTrackerPda] = getLegacyTrackerPda(walletPda);
  const [nativeTrackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);

  const ownerProgram = createProgram(
    idlJson as Idl,
    connection,
    walletFromKeypair(ownerKp)
  );
  const agentProgram = createProgram(
    idlJson as Idl,
    connection,
    walletFromKeypair(agentKp)
  );

  // ── Step 1: Create wallet with micro-payment policy ────────────────────
  log("1/6", "Creating MCP payment wallet...");
  log(
    "1/6",
    "Policy: max 0.01 SOL/tx, 0.05 SOL/day, any program allowed, 24/7"
  );

  await ownerProgram.methods
    .createWallet(
      sol(0.01), // max per tx: 0.01 SOL (micro-payments)
      sol(0.05), // daily budget: 0.05 SOL
      [],        // all programs allowed (MCP tools use various programs)
      null,      // no time restriction
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

  // ── Step 2: Fund wallet ────────────────────────────────────────────────
  log("2/6", "Funding wallet with 0.05 SOL (daily budget)...");

  await ownerProgram.methods
    .fundWallet(sol(0.05))
    .accounts({
      owner: ownerKp.publicKey,
      wallet: walletPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const bal = await connection.getBalance(walletPda);
  log("2/6", `Wallet balance: ${lamToSol(bal)} SOL`);

  // ── Step 3-6: Agent makes MCP tool payment requests ────────────────────
  let nextRequestId: number;
  let nextAuditId: number;

  const results: {
    tool: string;
    amount: string;
    status: string;
    reason: string;
  }[] = [];

  for (let i = 0; i < MCP_TOOLS.length; i++) {
    const tool = MCP_TOOLS[i];
    const stepLabel = `${i + 3}/8`;

    log(stepLabel, `Agent calling MCP tool: "${tool.name}" — ${tool.desc}`);
    log(
      stepLabel,
      `x402 payment: ${tool.costSol} SOL → vendor ${vendorKp.publicKey.toBase58().slice(0, 8)}...`
    );

    // Fetch current IDs
    const walletState = await (agentProgram.account as any).smartWallet.fetch(
      walletPda
    );
    nextRequestId = walletState.nextRequestId.toNumber();
    nextAuditId = walletState.nextAuditId.toNumber();

    const [requestPda] = getRequestPda(walletPda, nextRequestId);
    const [auditPda] = getAuditPda(walletPda, nextAuditId);
    const payload = buildNativeRequestPayload();

    try {
      await agentProgram.methods
        .submitRequest(
          sol(tool.costSol),
          `x402: ${tool.name} — ${tool.desc}`,
          payload.instructionHash,
          payload.accountsHash,
          null
        )
        .accounts({
          agent: agentKp.publicKey,
          wallet: walletPda,
          policy: policyPda,
          request: requestPda,
          auditEntry: auditPda,
          recipient: vendorKp.publicKey,
          assetMint: NATIVE_MINT,
          assetTracker: nativeTrackerPda,
          counterpartyPolicy: null,
          targetProgram: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([agentKp])
        .rpc();

      // Check request status
      const reqData = await (
        agentProgram.account as any
      ).executionRequest.fetch(requestPda);

      if (reqData.status === 0) {
        // Auto-approved — execute
        const walletState2 = await (
          agentProgram.account as any
        ).smartWallet.fetch(walletPda);
        const [execAuditPda] = getAuditPda(
          walletPda,
          walletState2.nextAuditId.toNumber()
        );

        await agentProgram.methods
          .executeRequest()
          .accounts({
            agent: agentKp.publicKey,
            wallet: walletPda,
            policy: policyPda,
            request: requestPda,
            assetTracker: nativeTrackerPda,
            auditEntry: execAuditPda,
            targetProgram: SystemProgram.programId,
            recipient: vendorKp.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([agentKp])
          .rpc();

        console.log(`  ✅ APPROVED + EXECUTED — ${tool.costSol} SOL paid to vendor`);
        results.push({
          tool: tool.name,
          amount: `${tool.costSol} SOL`,
          status: "✅ Paid",
          reason: "Within policy",
        });
      } else if (reqData.status === 2) {
        const reason =
          DENIAL_REASONS[reqData.denialReason] ?? `Code ${reqData.denialReason}`;
        console.log(`  🚫 DENIED — ${reason}`);
        results.push({
          tool: tool.name,
          amount: `${tool.costSol} SOL`,
          status: "🚫 Denied",
          reason,
        });
      } else {
        console.log(`  ⏳ Pending (status ${reqData.status})`);
        results.push({
          tool: tool.name,
          amount: `${tool.costSol} SOL`,
          status: "⏳ Pending",
          reason: "Awaiting approval",
        });
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const reason = msg.includes("ExceedsPerTx")
        ? "Exceeds per-transaction limit"
        : msg.includes("ExceedsDaily") || msg.includes("BudgetExhausted")
          ? "Daily budget exhausted"
          : msg.slice(0, 100);
      console.log(`  🚫 BLOCKED — ${reason}`);
      results.push({
        tool: tool.name,
        amount: `${tool.costSol} SOL`,
        status: "🚫 Blocked",
        reason,
      });
    }
  }

  // ── Summary Table ──────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(64)}`);
  console.log("  x402 MCP Tool Payment Summary");
  console.log(`${"─".repeat(64)}`);
  console.log(
    `  ${"Tool".padEnd(18)} ${"Amount".padEnd(12)} ${"Status".padEnd(12)} Reason`
  );
  console.log(`  ${"─".repeat(58)}`);
  for (const r of results) {
    console.log(
      `  ${r.tool.padEnd(18)} ${r.amount.padEnd(12)} ${r.status.padEnd(12)} ${r.reason}`
    );
  }

  // ── Audit Trail ────────────────────────────────────────────────────────
  log("AUDIT", "Fetching on-chain audit trail...");

  const auditPage = await fetchAuditEntriesPage(
    ownerProgram,
    walletPda,
    0,
    25
  );

  console.log(`\n${"─".repeat(64)}`);
  console.log(`  On-Chain Audit Trail (${auditPage.items.length} entries)`);
  console.log(`${"─".repeat(64)}`);

  for (const entry of auditPage.items) {
    const status = entry.approved ? "✔ APPROVED" : "✘ DENIED";
    const reason =
      DENIAL_REASONS[entry.denialReason] ?? `Code ${entry.denialReason}`;
    const ts = new Date(entry.timestamp.toNumber() * 1000).toISOString();

    console.log(
      `  ${status}  ${lamToSol(entry.amount)} SOL  ` +
        `reason=${reason}  ` +
        `memo="${entry.memo}"  ` +
        ts
    );
  }

  // ── Final state ────────────────────────────────────────────────────────
  const finalBal = await connection.getBalance(walletPda);
  const vendorBal = await connection.getBalance(vendorKp.publicKey);
  const finalWallet = await (ownerProgram.account as any).smartWallet.fetch(
    walletPda
  );

  console.log(`\n${"─".repeat(64)}`);
  console.log("  Final State");
  console.log(`${"─".repeat(64)}`);
  console.log(`  Wallet balance : ${lamToSol(finalBal)} SOL`);
  console.log(`  Vendor received: ${lamToSol(vendorBal)} SOL`);
  console.log(`  Total approved : ${finalWallet.totalApproved}`);
  console.log(`  Total denied   : ${finalWallet.totalDenied}`);
  console.log(
    `  Reputation     : ${
      finalWallet.totalApproved.toNumber() + finalWallet.totalDenied.toNumber() > 0
        ? Math.round(
            (finalWallet.totalApproved.toNumber() /
              (finalWallet.totalApproved.toNumber() +
                finalWallet.totalDenied.toNumber())) *
              100
          )
        : 0
    }%`
  );

  console.log(`\n${"=".repeat(64)}`);
  console.log("  TavSin x402 MCP demo complete");
  console.log("  Every tool payment was governed by on-chain policy.");
  console.log("  The agent could NOT bypass spending limits.");
  console.log(`${"=".repeat(64)}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
