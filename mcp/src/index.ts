#!/usr/bin/env node
/**
 * TavSin MCP Tool Server
 *
 * Exposes TavSin smart-wallet operations as Model Context Protocol tools
 * so any MCP-compatible AI agent can interact with governed Solana wallets.
 *
 * Transport: stdio (compatible with Claude Desktop, Cursor, etc.)
 *
 * Required env:
 *   SOLANA_RPC_URL        – RPC endpoint (defaults to devnet)
 *   TAVSIN_AGENT_KEYPAIR  – base-58 or JSON-array secret key for the agent
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { type Idl } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  buildNativeRequestPayload,
  createProgram,
  createReadonlyProgram,
  fetchAuditEntriesPage,
  fetchPendingApprovalsForOwner,
  fetchRequestsPage,
  fetchWalletDetail,
  fetchWalletsForOwner,
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
import idlJson from "../../target/idl/tavsin.json";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

async function loadAgentKeypair(): Promise<Keypair | null> {
  const raw = process.env.TAVSIN_AGENT_KEYPAIR;
  if (!raw) return null;
  try {
    // JSON array format: [1,2,3,...]
    if (raw.startsWith("[")) {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
    }
    // base-58 format
    const { default: bs58 } = await import("bs58") as any;
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
}

// We lazily resolve the agent keypair — tools that need signing check it.
let _agentKeypair: Keypair | null | undefined;
async function getAgentKeypair(): Promise<Keypair | null> {
  if (_agentKeypair === undefined) {
    _agentKeypair = await loadAgentKeypair();
  }
  return _agentKeypair;
}

async function requireAgentKeypair(): Promise<Keypair> {
  const kp = await getAgentKeypair();
  if (!kp) throw new Error("TAVSIN_AGENT_KEYPAIR env var is required for write operations");
  return kp;
}

function anchorWallet(kp: Keypair): AnchorCompatibleWallet {
  return {
    publicKey: kp.publicKey,
    async signTransaction(tx: any) {
      tx.sign(kp);
      return tx;
    },
    async signAllTransactions(txs: any[]) {
      txs.forEach((tx) => tx.sign(kp));
      return txs;
    },
  };
}

function getReadonlyProgram() {
  return createReadonlyProgram(idlJson as Idl, connection);
}

async function getSigningProgram() {
  const kp = await requireAgentKeypair();
  return createProgram(idlJson as Idl, connection, anchorWallet(kp));
}

function pubkey(input: string): PublicKey {
  return new PublicKey(input);
}

/** Convert BN|number lamports to SOL number */
function toSol(val: any): number {
  const n = typeof val === "number" ? val : val?.toNumber?.() ?? 0;
  return n / LAMPORTS_PER_SOL;
}

/** Safe accessor for Anchor account data */
function acc(detail: any): any {
  // WalletDetail.walletAccount is WalletSummary which has .account
  return detail?.walletAccount?.account ?? detail?.walletAccount ?? {};
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "tavsin",
  version: "0.1.0",
});

// ── list_wallets ────────────────────────────────────────────────────────────
server.tool(
  "list_wallets",
  "List all TavSin smart wallets owned by a public key, including balances, policies, and spend tracking.",
  {
    owner: z.string().describe("The wallet owner's Solana public key (base-58)"),
  },
  async ({ owner }) => {
    const program = getReadonlyProgram();
    const wallets = await fetchWalletsForOwner(program, connection, pubkey(owner));
    const summaries = wallets.map((w) => ({
      address: w.publicKey.toBase58(),
      agent: w.account.agent.toBase58(),
      frozen: w.account.frozen,
      balance_sol: w.balance,
      pending_requests: w.account.totalPending.toNumber(),
      total_approved: w.account.totalApproved.toNumber(),
      total_denied: w.account.totalDenied.toNumber(),
      policy: w.policy
        ? {
            max_per_tx_sol: toSol(w.policy.maxPerTx),
            max_daily_sol: toSol(w.policy.maxDaily),
            approval_threshold_sol: toSol(w.policy.approvalThreshold),
            allowed_programs: w.policy.allowedPrograms.map((p: PublicKey) => p.toBase58()),
            time_window: w.policy.timeWindowStart && w.policy.timeWindowEnd
              ? `${w.policy.timeWindowStart}:00 - ${w.policy.timeWindowEnd}:00 UTC`
              : "unrestricted",
          }
        : null,
      spent_today_sol: w.nativeAssetTracker
        ? toSol(w.nativeAssetTracker.spentInPeriod)
        : 0,
    }));
    return { content: [{ type: "text", text: JSON.stringify(summaries, null, 2) }] };
  }
);

// ── get_wallet_detail ───────────────────────────────────────────────────────
server.tool(
  "get_wallet_detail",
  "Get full details for a TavSin smart wallet: policy, spend tracking, recent audit entries, and requests.",
  {
    wallet: z.string().describe("The TavSin smart wallet PDA address (base-58)"),
  },
  async ({ wallet }) => {
    const program = getReadonlyProgram();
    const detail = await fetchWalletDetail(program, connection, pubkey(wallet), 10);
    const result = {
      owner: acc(detail).owner.toBase58(),
      agent: acc(detail).agent.toBase58(),
      frozen: acc(detail).frozen,
      policy: detail.policy
        ? {
            max_per_tx_sol: toSol(detail.policy.maxPerTx),
            max_daily_sol: toSol(detail.policy.maxDaily),
            approval_threshold_sol: toSol(detail.policy.approvalThreshold),
            blocked_mints: detail.policy.blockedMints.map((m: PublicKey) => m.toBase58()),
            allowed_programs: detail.policy.allowedPrograms.map((p: PublicKey) => p.toBase58()),
          }
        : null,
      spent_today_sol: detail.nativeAssetTracker
        ? toSol(detail.nativeAssetTracker.spentInPeriod)
        : 0,
      recent_audit: detail.auditEntries.map((e) => ({
        approved: e.approved,
        amount_sol: toSol(e.amount),
        target: e.targetProgram.toBase58(),
        memo: e.memo,
        denial_reason: !e.approved ? DENIAL_REASONS[e.denialReason] ?? `code ${e.denialReason}` : null,
        timestamp: new Date(e.timestamp.toNumber() * 1000).toISOString(),
      })),
      recent_requests: detail.requests.map((r) => ({
        id: r.requestId.toNumber(),
        status: REQUEST_STATUSES[r.status] ?? `status ${r.status}`,
        amount_sol: toSol(r.amount),
        recipient: r.recipient.toBase58(),
        memo: r.memo,
        requested_at: new Date(r.requestedAt.toNumber() * 1000).toISOString(),
      })),
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── check_budget ────────────────────────────────────────────────────────────
server.tool(
  "check_budget",
  "Check how much budget remains for a TavSin smart wallet (daily limit minus spent today).",
  {
    wallet: z.string().describe("The TavSin smart wallet PDA address (base-58)"),
  },
  async ({ wallet }) => {
    const program = getReadonlyProgram();
    const detail = await fetchWalletDetail(program, connection, pubkey(wallet), 0);
    const dailyLimit = detail.policy ? toSol(detail.policy.maxDaily) : 0;
    const spent = detail.nativeAssetTracker
      ? toSol(detail.nativeAssetTracker.spentInPeriod)
      : 0;
    const remaining = Math.max(0, dailyLimit - spent);
    const result = {
      daily_limit_sol: dailyLimit,
      spent_today_sol: spent,
      remaining_sol: remaining,
      frozen: acc(detail).frozen,
      max_per_tx_sol: detail.policy ? toSol(detail.policy.maxPerTx) : 0,
    };
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// ── submit_request ──────────────────────────────────────────────────────────
server.tool(
  "submit_request",
  "Submit a spending request from this agent to a TavSin smart wallet. The request goes through policy checks — it may be auto-approved or require owner approval.",
  {
    wallet: z.string().describe("The TavSin smart wallet PDA address"),
    recipient: z.string().describe("The recipient Solana address for the transfer"),
    amount_sol: z.number().positive().describe("Amount in SOL to request"),
    memo: z.string().optional().describe("Short memo for the request"),
    expires_in_minutes: z.number().positive().optional().describe("Minutes until the request expires (default: 60)"),
  },
  async ({ wallet, recipient, amount_sol, memo, expires_in_minutes }) => {
    const kp = await requireAgentKeypair();
    const program = await getSigningProgram();
    const walletPda = pubkey(wallet);
    const walletAccount = await (program.account as any).smartWallet.fetch(walletPda);
    const [requestPda] = getRequestPda(walletPda, walletAccount.nextRequestId.toNumber());
    const [auditEntryPda] = getAuditPda(walletPda, walletAccount.nextAuditId.toNumber());
    const [assetTrackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);
    const payload = buildNativeRequestPayload();
    const expiresAt = new BN(
      Math.floor(Date.now() / 1000) + (expires_in_minutes ?? 60) * 60
    );

    const sig = await program.methods
      .submitRequest(
        new BN(Math.floor(amount_sol * LAMPORTS_PER_SOL)),
        memo ?? "MCP agent request",
        payload.instructionHash,
        payload.accountsHash,
        expiresAt
      )
      .accounts({
        agent: kp.publicKey,
        wallet: walletPda,
        policy: getPolicyPda(walletPda)[0],
        request: requestPda,
        auditEntry: auditEntryPda,
        recipient: pubkey(recipient),
        assetMint: NATIVE_MINT,
        assetTracker: assetTrackerPda,
        targetProgram: payload.targetProgram,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Fetch the request to see if it was auto-approved or is pending
    const request = await (program.account as any).executionRequest.fetch(requestPda);
    const statusLabel = REQUEST_STATUSES[request.status] ?? `status ${request.status}`;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              request_pda: requestPda.toBase58(),
              request_id: walletAccount.nextRequestId.toNumber(),
              status: statusLabel,
              amount_sol,
              recipient,
              signature: sig,
              message:
                request.status === 0
                  ? "Request submitted but requires owner approval (amount exceeds auto-approval threshold or policy requires approval)."
                  : request.status === 3
                  ? "Request auto-approved and executed! Transfer complete."
                  : `Request is ${statusLabel}.`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── get_pending_approvals ───────────────────────────────────────────────────
server.tool(
  "get_pending_approvals",
  "List all pending spending requests across wallets owned by a public key, waiting for approval.",
  {
    owner: z.string().describe("The wallet owner's Solana public key"),
  },
  async ({ owner }) => {
    const program = getReadonlyProgram();
    const page = await fetchPendingApprovalsForOwner(program, connection, pubkey(owner), 0, 50);
    const items = page.items.map((item) => ({
      wallet: item.wallet.toBase58(),
      agent: item.agent.toBase58(),
      request_id: item.request.requestId.toNumber(),
      amount_sol: toSol(item.request.amount),
      recipient: item.request.recipient.toBase58(),
      memo: item.request.memo,
      requested_at: new Date(item.request.requestedAt.toNumber() * 1000).toISOString(),
      expires_at: item.request.expiresAt
        ? new Date(item.request.expiresAt.toNumber() * 1000).toISOString()
        : null,
    }));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total: page.total, pending_requests: items }, null, 2),
        },
      ],
    };
  }
);

// ── get_audit_log ───────────────────────────────────────────────────────────
server.tool(
  "get_audit_log",
  "Fetch the audit log for a TavSin smart wallet — shows approved/denied transactions with reasons.",
  {
    wallet: z.string().describe("The TavSin smart wallet PDA address"),
    limit: z.number().int().min(1).max(100).optional().describe("Number of entries to fetch (default 25)"),
  },
  async ({ wallet, limit }) => {
    const program = getReadonlyProgram();
    const page = await fetchAuditEntriesPage(program, pubkey(wallet), 0, limit ?? 25);
    const entries = page.items.map((e) => ({
      approved: e.approved,
      outcome: e.outcome,
      amount_sol: toSol(e.amount),
      target_program: e.targetProgram.toBase58(),
      recipient: e.recipient.toBase58(),
      asset_mint: e.assetMint.toBase58(),
      memo: e.memo,
      denial_reason: !e.approved ? DENIAL_REASONS[e.denialReason] ?? `code ${e.denialReason}` : null,
      timestamp: new Date(e.timestamp.toNumber() * 1000).toISOString(),
    }));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total: page.total, entries }, null, 2),
        },
      ],
    };
  }
);

// ── create_wallet ───────────────────────────────────────────────────────────
server.tool(
  "create_wallet",
  "Create a new TavSin policy-governed smart wallet for an AI agent. The caller becomes the wallet owner.",
  {
    agent: z.string().describe("The agent's Solana public key that will operate this wallet"),
    max_per_tx_sol: z.number().positive().describe("Maximum SOL per transaction"),
    max_daily_sol: z.number().positive().describe("Maximum SOL the agent can spend per day"),
    allowed_programs: z
      .array(z.string())
      .optional()
      .describe("List of program IDs the agent is allowed to call (empty = allow all)"),
    time_window_start: z
      .number()
      .int()
      .min(0)
      .max(23)
      .optional()
      .describe("UTC hour when the agent can start transacting (0-23)"),
    time_window_end: z
      .number()
      .int()
      .min(0)
      .max(23)
      .optional()
      .describe("UTC hour when the agent must stop transacting (0-23)"),
  },
  async ({ agent, max_per_tx_sol, max_daily_sol, allowed_programs, time_window_start, time_window_end }) => {
    const kp = await requireAgentKeypair();
    const program = await getSigningProgram();
    const agentPubkey = pubkey(agent);
    const [walletPda] = getWalletPda(kp.publicKey, agentPubkey);
    const [policyPda] = getPolicyPda(walletPda);
    const [trackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);

    const sig = await program.methods
      .createWallet(
        new BN(Math.floor(max_per_tx_sol * LAMPORTS_PER_SOL)),
        new BN(Math.floor(max_daily_sol * LAMPORTS_PER_SOL)),
        (allowed_programs ?? []).map((p) => pubkey(p)),
        time_window_start ?? null,
        time_window_end ?? null
      )
      .accounts({
        owner: kp.publicKey,
        agent: agentPubkey,
        wallet: walletPda,
        policy: policyPda,
        tracker: trackerPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              wallet_pda: walletPda.toBase58(),
              policy_pda: policyPda.toBase58(),
              owner: kp.publicKey.toBase58(),
              agent,
              max_per_tx_sol,
              max_daily_sol,
              signature: sig,
              message: `Wallet created! Fund it by sending SOL to ${walletPda.toBase58()}`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TavSin MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
