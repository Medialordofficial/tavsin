/**
 * Telegram Kill-Switch Bot — Next.js API Route
 *
 * Handles webhook updates from Telegram. Supported commands:
 *   /freeze <wallet_address>   — Freeze a TavSin smart wallet
 *   /unfreeze <wallet_address> — Unfreeze a TavSin smart wallet
 *   /status <wallet_address>   — Check wallet frozen status
 *   /help                      — Show available commands
 *
 * Required env vars:
 *   TELEGRAM_BOT_TOKEN      — Bot token from @BotFather
 *   TAVSIN_OWNER_KEYPAIR    — JSON array of the owner's secret key bytes
 *   TELEGRAM_ALLOWED_CHAT_IDS — Comma-separated chat IDs allowed to use the bot
 */

import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { createProgram, getWalletPda } from "@tavsin/sdk";
import idlJson from "@/lib/tavsin_idl.json";
import { getServerRpcEndpoint } from "@/lib/network";
import { getServerProgramId } from "@/lib/program-config";

/* ── Env helpers ─────────────────────────────────────── */

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

function getOwnerKeypair(): Keypair | null {
  const raw = process.env.TAVSIN_OWNER_KEYPAIR;
  if (!raw) return null;
  try {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  } catch {
    return null;
  }
}

function getAllowedChatIds(): Set<number> {
  const raw = process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
  );
}

/* ── Telegram API ────────────────────────────────────── */

async function sendMessage(chatId: number, text: string) {
  const token = getBotToken();
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

/* ── Wallet helpers (Anchor-compatible wallet from Keypair) ── */

function keypairWallet(kp: Keypair) {
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

/* ── Command handlers ────────────────────────────────── */

async function handleFreeze(chatId: number, walletAddress: string) {
  const ownerKp = getOwnerKeypair();
  if (!ownerKp) {
    await sendMessage(chatId, "❌ Owner keypair not configured.");
    return;
  }

  let walletPda: PublicKey;
  try {
    walletPda = new PublicKey(walletAddress);
  } catch {
    await sendMessage(chatId, "❌ Invalid wallet address.");
    return;
  }

  try {
    const connection = new Connection(getServerRpcEndpoint(), "confirmed");
    const program = createProgram(
      idlJson as Idl,
      connection,
      keypairWallet(ownerKp),
      getServerProgramId()
    );

    await program.methods
      .freezeWallet()
      .accounts({
        owner: ownerKp.publicKey,
        wallet: walletPda,
      })
      .rpc();

    await sendMessage(
      chatId,
      `🔴 *FROZEN* wallet\n\`${walletAddress}\`\n\nAll agent transactions will be blocked until unfrozen.`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await sendMessage(chatId, `❌ Freeze failed:\n\`${msg.slice(0, 200)}\``);
  }
}

async function handleUnfreeze(chatId: number, walletAddress: string) {
  const ownerKp = getOwnerKeypair();
  if (!ownerKp) {
    await sendMessage(chatId, "❌ Owner keypair not configured.");
    return;
  }

  let walletPda: PublicKey;
  try {
    walletPda = new PublicKey(walletAddress);
  } catch {
    await sendMessage(chatId, "❌ Invalid wallet address.");
    return;
  }

  try {
    const connection = new Connection(getServerRpcEndpoint(), "confirmed");
    const program = createProgram(
      idlJson as Idl,
      connection,
      keypairWallet(ownerKp),
      getServerProgramId()
    );

    await program.methods
      .unfreezeWallet()
      .accounts({
        owner: ownerKp.publicKey,
        wallet: walletPda,
      })
      .rpc();

    await sendMessage(
      chatId,
      `🟢 *UNFROZEN* wallet\n\`${walletAddress}\`\n\nAgent transactions are now allowed.`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await sendMessage(
      chatId,
      `❌ Unfreeze failed:\n\`${msg.slice(0, 200)}\``
    );
  }
}

async function handleStatus(chatId: number, walletAddress: string) {
  let walletPda: PublicKey;
  try {
    walletPda = new PublicKey(walletAddress);
  } catch {
    await sendMessage(chatId, "❌ Invalid wallet address.");
    return;
  }

  try {
    const connection = new Connection(getServerRpcEndpoint(), "confirmed");
    const ownerKp = getOwnerKeypair();
    if (!ownerKp) {
      await sendMessage(chatId, "❌ Owner keypair not configured.");
      return;
    }
    const program = createProgram(
      idlJson as Idl,
      connection,
      keypairWallet(ownerKp),
      getServerProgramId()
    );

    const walletData = await (program.account as any).smartWallet.fetch(
      walletPda
    );

    const frozen = walletData.frozen ? "🔴 FROZEN" : "🟢 Active";
    const balance = await connection.getBalance(walletPda);
    const solBalance = (balance / 1e9).toFixed(4);

    await sendMessage(
      chatId,
      `*Wallet Status*\n\`${walletAddress}\`\n\nStatus: ${frozen}\nBalance: ${solBalance} SOL\nAgent: \`${walletData.agent.toBase58()}\`\nRequests: ${walletData.nextRequestId}`
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await sendMessage(chatId, `❌ Status check failed:\n\`${msg.slice(0, 200)}\``);
  }
}

const HELP_TEXT = `🛡️ *TavSin Kill-Switch Bot*

Commands:
/freeze <wallet\\_address> — Freeze a wallet (blocks all agent txns)
/unfreeze <wallet\\_address> — Unfreeze a wallet
/status <wallet\\_address> — Check wallet status & balance
/help — Show this message`;

/* ── Webhook handler ─────────────────────────────────── */

export async function POST(req: NextRequest) {
  const token = getBotToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Bot not configured" }, { status: 503 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = body?.message;
  if (!message?.text || !message?.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const chatId: number = message.chat.id;
  const text: string = message.text.trim();

  // Auth check — restrict to allowed chat IDs
  const allowed = getAllowedChatIds();
  if (allowed.size > 0 && !allowed.has(chatId)) {
    await sendMessage(chatId, "⛔ Unauthorized. Your chat ID is not allowed.");
    return NextResponse.json({ ok: true });
  }

  // Parse commands
  if (text.startsWith("/freeze ")) {
    const walletAddr = text.slice("/freeze ".length).trim();
    await handleFreeze(chatId, walletAddr);
  } else if (text.startsWith("/unfreeze ")) {
    const walletAddr = text.slice("/unfreeze ".length).trim();
    await handleUnfreeze(chatId, walletAddr);
  } else if (text.startsWith("/status ")) {
    const walletAddr = text.slice("/status ".length).trim();
    await handleStatus(chatId, walletAddr);
  } else if (text === "/help" || text === "/start") {
    await sendMessage(chatId, HELP_TEXT);
  } else {
    await sendMessage(chatId, `Unknown command. Type /help for usage.`);
  }

  return NextResponse.json({ ok: true });
}
