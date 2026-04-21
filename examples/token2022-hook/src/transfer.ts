/**
 * Demo transfer that exercises the TavSin transfer hook.
 *
 * Run:
 *   MINT=<token-2022 mint with hook> \
 *   HOOK_PROGRAM_ID=<hook program id> \
 *   SENDER_TOKEN_ACCOUNT=<source ATA owned by TavSin wallet PDA> \
 *   RECIPIENT_TOKEN_ACCOUNT=<destination ATA> \
 *   OWNER_KEYPAIR=~/.config/solana/id.json \
 *   AMOUNT=1000000 \
 *   npm run transfer
 *
 * The transfer will succeed only if TavSin policy approves it.
 */

import { readFileSync } from "node:fs";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import {
  createTransferCheckedWithTransferHookInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

function loadKeypair(path: string): Keypair {
  const expanded = path.startsWith("~/")
    ? path.replace("~", process.env.HOME ?? "")
    : path;
  const raw = JSON.parse(readFileSync(expanded, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name}`);
  return v;
}

async function main() {
  const connection = new Connection(
    process.env.RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed"
  );
  const owner = loadKeypair(
    process.env.OWNER_KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`
  );

  const mint = new PublicKey(requireEnv("MINT"));
  const sender = new PublicKey(requireEnv("SENDER_TOKEN_ACCOUNT"));
  const recipient = new PublicKey(requireEnv("RECIPIENT_TOKEN_ACCOUNT"));
  const amount = BigInt(requireEnv("AMOUNT"));
  const decimals = Number(process.env.DECIMALS ?? "6");

  // The SPL helper auto-resolves extra accounts the hook declared in its
  // ExtraAccountMetaList PDA — including the TavSin program and any
  // PDAs the policy check needs.
  const ix = await createTransferCheckedWithTransferHookInstruction(
    connection,
    sender,
    mint,
    recipient,
    owner.publicKey,
    amount,
    decimals,
    [],
    "confirmed",
    TOKEN_2022_PROGRAM_ID
  );

  const tx = new Transaction().add(ix);
  try {
    const sig = await sendAndConfirmTransaction(connection, tx, [owner], {
      commitment: "confirmed",
    });
    console.log(`TavSin approved. Transfer landed: ${sig}`);
  } catch (err) {
    console.error("Transfer failed (TavSin policy denied or hook errored):");
    console.error(err);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
