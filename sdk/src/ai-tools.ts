/**
 * TavSin AI Tools — framework-agnostic tool definitions for AI agents.
 *
 * Each tool exports a JSON Schema (for OpenAI function calling, Anthropic
 * tool use, Vercel AI SDK, LangChain, Solana Agent Kit, etc.) plus an
 * `execute` function that takes parsed args and returns a result.
 *
 * Usage with Vercel AI SDK:
 *   import { tool } from "ai";
 *   import { tavsinTools } from "@tavsin/sdk/ai-tools";
 *   const tools = tavsinTools({ program, agentKp });
 *   // pass `tools` directly to generateText / streamText
 *
 * Usage with Anthropic SDK:
 *   const tools = tavsinToolDefinitions(); // → array of { name, description, input_schema }
 *   // dispatch tool_use blocks via tavsinExecuteTool(name, input, ctx)
 */

import type { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  type Connection,
  type Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import {
  getAssetTrackerPda,
  getAuditPda,
  getPolicyPda,
  getRequestPda,
  getWalletPda,
  NATIVE_MINT,
} from "./program";
import { fetchWalletDetail, fetchWalletsForOwner } from "./queries";

export interface TavsinToolContext {
  /** Anchor program initialized with an agent or read-only wallet */
  program: Program;
  /** RPC connection (usually program.provider.connection) */
  connection: Connection;
  /** Agent keypair — required only for write tools (submit_request, create_wallet) */
  agentKp?: Keypair;
}

/** JSON Schema definition for one tool, compatible with OpenAI / Anthropic / Vercel AI SDK */
export interface TavsinToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * Returns the canonical JSON-Schema tool definitions. Use these directly with
 * Anthropic SDK, OpenAI function calling, or any framework that accepts
 * JSON-Schema tool descriptors.
 */
export function tavsinToolDefinitions(): TavsinToolDefinition[] {
  return [
    {
      name: "tavsin_list_wallets",
      description:
        "List all TavSin smart wallets owned by a public key. Returns wallet addresses, agent addresses, and on-chain status.",
      input_schema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Owner's Solana public key (base58)" },
        },
        required: ["owner"],
      },
    },
    {
      name: "tavsin_get_wallet_detail",
      description:
        "Get full snapshot of a TavSin wallet: policy, balances, recent audit entries, frozen status. Use this before suggesting any spending action.",
      input_schema: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Wallet PDA address (base58)" },
          audit_limit: { type: "number", description: "How many audit entries to fetch (default 10)" },
        },
        required: ["wallet"],
      },
    },
    {
      name: "tavsin_check_budget",
      description:
        "Check remaining daily spending budget for a wallet. Returns spent / remaining / cap in lamports (or token base units for SPL).",
      input_schema: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Wallet PDA address" },
          mint: { type: "string", description: "Asset mint (omit or use SOL for native)" },
        },
        required: ["wallet"],
      },
    },
    {
      name: "tavsin_get_audit_log",
      description:
        "Fetch the on-chain audit log for a wallet. Each entry shows approved/denied, amount, recipient, and reason. Use this to explain past behavior or prove compliance.",
      input_schema: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Wallet PDA address" },
          limit: { type: "number", description: "Number of entries (default 20)" },
        },
        required: ["wallet"],
      },
    },
    {
      name: "tavsin_submit_request",
      description:
        "Submit a spending request to a TavSin wallet. The on-chain policy will approve, deny, or escalate based on per-tx limits, daily budget, allowlists, and freeze status. Requires an agent keypair in the context.",
      input_schema: {
        type: "object",
        properties: {
          wallet: { type: "string", description: "Wallet PDA address" },
          recipient: { type: "string", description: "Recipient's address (token account for SPL, system account for SOL)" },
          mint: { type: "string", description: "Asset mint (use 'SOL' or 'native' for SOL)" },
          amount: { type: "number", description: "Amount in human units (e.g. 25 = 25 USDC, 0.5 = 0.5 SOL)" },
          memo: { type: "string", description: "Short description of the spending purpose (logged on-chain)" },
        },
        required: ["wallet", "recipient", "amount", "memo"],
      },
    },
  ];
}

/**
 * Execute a tool by name with parsed arguments. Returns a JSON-serializable
 * result. Throws on invalid input or program errors.
 */
export async function tavsinExecuteTool(
  name: string,
  input: Record<string, unknown>,
  ctx: TavsinToolContext
): Promise<unknown> {
  switch (name) {
    case "tavsin_list_wallets":
      return await execListWallets(input, ctx);
    case "tavsin_get_wallet_detail":
      return await execGetWalletDetail(input, ctx);
    case "tavsin_check_budget":
      return await execCheckBudget(input, ctx);
    case "tavsin_get_audit_log":
      return await execGetAuditLog(input, ctx);
    case "tavsin_submit_request":
      return await execSubmitRequest(input, ctx);
    default:
      throw new Error(`Unknown TavSin tool: ${name}`);
  }
}

/* ───────────────────────── tool executors ───────────────────────── */

async function execListWallets(input: Record<string, unknown>, ctx: TavsinToolContext) {
  const owner = new PublicKey(String(input.owner));
  const wallets = await fetchWalletsForOwner(ctx.program, ctx.connection, owner);
  return {
    count: wallets.length,
    wallets: wallets.map((w) => ({
      address: w.publicKey.toBase58(),
      owner: (w.account as any).owner?.toBase58?.(),
      agent: (w.account as any).agent?.toBase58?.(),
      frozen: !!(w.account as any).frozen,
      total_approved: (w.account as any).totalApproved?.toNumber?.() ?? 0,
      total_denied: (w.account as any).totalDenied?.toNumber?.() ?? 0,
    })),
  };
}

async function execGetWalletDetail(input: Record<string, unknown>, ctx: TavsinToolContext) {
  const wallet = new PublicKey(String(input.wallet));
  const limit = Number(input.audit_limit ?? 10);
  const detail = await fetchWalletDetail(ctx.program, ctx.connection, wallet, limit);
  const wa: any = detail.walletAccount?.account ?? {};
  const policy: any = detail.policy ?? {};
  return {
    wallet: wallet.toBase58(),
    owner: wa.owner?.toBase58?.(),
    agent: wa.agent?.toBase58?.(),
    frozen: !!wa.frozen,
    policy: {
      max_per_tx: policy.maxPerTx?.toNumber?.() ?? 0,
      max_daily: policy.maxDaily?.toNumber?.() ?? 0,
      allowed_programs: (policy.allowedPrograms ?? []).map((p: PublicKey) => p.toBase58()),
    },
    totals: {
      approved: wa.totalApproved?.toNumber?.() ?? 0,
      denied: wa.totalDenied?.toNumber?.() ?? 0,
    },
    recent_audit: detail.auditEntries.slice(0, limit).map((e) => ({
      approved: e.approved,
      amount: (e.amount as any)?.toNumber?.() ?? 0,
      memo: e.memo,
      timestamp: e.timestamp.toNumber(),
      denial_reason: e.approved ? null : e.denialReason,
    })),
  };
}

async function execCheckBudget(input: Record<string, unknown>, ctx: TavsinToolContext) {
  const wallet = new PublicKey(String(input.wallet));
  const mintStr = input.mint ? String(input.mint) : "SOL";
  const mint = mintStr === "SOL" || mintStr === "native"
    ? NATIVE_MINT
    : new PublicKey(mintStr);
  const [trackerPda] = getAssetTrackerPda(wallet, mint);
  const [policyPda] = getPolicyPda(wallet);

  let tracker: any = null;
  let policy: any = null;
  try {
    tracker = await (ctx.program.account as any).assetSpendTracker.fetch(trackerPda);
  } catch { /* not yet initialized = nothing spent */ }
  try {
    policy = await (ctx.program.account as any).walletPolicy.fetch(policyPda);
  } catch { /* no policy */ }

  const dailyCap = policy?.maxDaily?.toNumber?.() ?? 0;
  const spentToday = tracker?.dailySpent?.toNumber?.() ?? 0;
  return {
    wallet: wallet.toBase58(),
    mint: mint.toBase58(),
    daily_cap: dailyCap,
    spent_today: spentToday,
    remaining: Math.max(0, dailyCap - spentToday),
  };
}

async function execGetAuditLog(input: Record<string, unknown>, ctx: TavsinToolContext) {
  const wallet = new PublicKey(String(input.wallet));
  const limit = Number(input.limit ?? 20);
  const detail = await fetchWalletDetail(ctx.program, ctx.connection, wallet, limit);
  return {
    wallet: wallet.toBase58(),
    entries: detail.auditEntries.map((e) => ({
      approved: e.approved,
      amount: (e.amount as any)?.toNumber?.() ?? 0,
      memo: e.memo,
      denial_reason: e.approved ? null : e.denialReason,
      timestamp: e.timestamp.toNumber(),
    })),
  };
}

async function execSubmitRequest(input: Record<string, unknown>, ctx: TavsinToolContext) {
  if (!ctx.agentKp) {
    throw new Error("submit_request requires an agentKp in the tool context");
  }
  const wallet = new PublicKey(String(input.wallet));
  const recipient = new PublicKey(String(input.recipient));
  const mintStr = input.mint ? String(input.mint) : "SOL";
  const isNative = mintStr === "SOL" || mintStr === "native";
  const mint = isNative ? NATIVE_MINT : new PublicKey(mintStr);
  // Convert human amount → base units. 9 decimals for SOL, default 6 for SPL.
  const decimals = isNative ? 9 : 6;
  const baseUnits = Math.round(Number(input.amount) * 10 ** decimals);
  const memo = String(input.memo);

  const [policyPda] = getPolicyPda(wallet);
  const [trackerPda] = getAssetTrackerPda(wallet, mint);
  const walletAccount = await (ctx.program.account as any).smartWallet.fetch(wallet);
  const requestId = walletAccount.nextRequestId.toNumber();
  const auditId = walletAccount.nextAuditId.toNumber();
  const [requestPda] = getRequestPda(wallet, requestId);
  const [auditPda] = getAuditPda(wallet, auditId);

  // Note: this is a "lite" submit that records the request and lets the policy
  // engine evaluate it. For full SPL execution, use buildRequestPayloadFromInstruction
  // + executeRequestWithPayload from the SDK.
  try {
    await ctx.program.methods
      .submitRequest(
        new BN(baseUnits),
        memo,
        Buffer.alloc(32),  // empty instruction hash for query-only submit
        Buffer.alloc(32),
        new BN(Math.floor(Date.now() / 1000) + 3600)
      )
      .accounts({
        agent: ctx.agentKp.publicKey,
        wallet,
        policy: policyPda,
        request: requestPda,
        auditEntry: auditPda,
        recipient,
        assetMint: mint,
        assetTracker: trackerPda,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  } catch (err: any) {
    return {
      status: "denied",
      reason: err?.error?.errorMessage ?? err?.message ?? "policy violation",
      request_id: requestId,
    };
  }

  const request: any = await (ctx.program.account as any).executionRequest.fetch(requestPda);
  const statusMap = ["pending", "approved", "denied", "auto_approved", "executed", "expired"];
  return {
    status: statusMap[request.status] ?? `code_${request.status}`,
    request_id: requestId,
    request_pda: requestPda.toBase58(),
    audit_pda: auditPda.toBase58(),
  };
}

/**
 * Vercel AI SDK helper: returns an object compatible with the `tools` parameter
 * of `generateText` / `streamText`. Each tool wraps `tavsinExecuteTool`.
 *
 * Note: requires `ai` package + `zod` to be installed by the consumer.
 * We don't import them here to keep the SDK dependency-light.
 */
export function tavsinTools(ctx: TavsinToolContext) {
  const definitions = tavsinToolDefinitions();
  const tools: Record<string, {
    description: string;
    parameters: unknown;
    execute: (args: Record<string, unknown>) => Promise<unknown>;
  }> = {};
  for (const def of definitions) {
    tools[def.name] = {
      description: def.description,
      parameters: def.input_schema,
      execute: (args) => tavsinExecuteTool(def.name, args, ctx),
    };
  }
  return tools;
}

/**
 * Solana Agent Kit (SendAI) plugin shape. Returns an object you can pass to
 * `agent.use(tavsinPlugin())`. The SAK runtime will register methods under
 * `agent.methods.tavsin*`.
 */
export function tavsinSolanaAgentKitPlugin(ctx: TavsinToolContext) {
  const definitions = tavsinToolDefinitions();
  return {
    name: "tavsin",
    version: "0.1.0",
    description:
      "TavSin: policy-enforced smart wallets. Spending caps, vendor allowlists, daily budgets, and a tamper-proof audit trail enforced on-chain.",
    methods: definitions.reduce((acc, def) => {
      const methodName = def.name.replace(/^tavsin_/, "tavsin").replace(/_(.)/g, (_, c) => c.toUpperCase());
      acc[methodName] = (args: Record<string, unknown>) => tavsinExecuteTool(def.name, args, ctx);
      return acc;
    }, {} as Record<string, (args: Record<string, unknown>) => Promise<unknown>>),
    actions: definitions.map((def) => ({
      name: def.name,
      description: def.description,
      schema: def.input_schema,
      handler: (args: Record<string, unknown>) => tavsinExecuteTool(def.name, args, ctx),
    })),
  };
}
