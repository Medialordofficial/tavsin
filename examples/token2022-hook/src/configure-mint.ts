/**
 * Configure a Token-2022 mint with a TransferHook pointing at the
 * TavSin hook program. Every transfer of this mint will then route
 * through the hook → TavSin policy.
 *
 * Run:
 *   HOOK_PROGRAM_ID=THook11111111111111111111111111111111111111 \
 *   PAYER_KEYPAIR=~/.config/solana/id.json \
 *   RPC_URL=https://api.devnet.solana.com \
 *   npm run configure-mint
 */

import { readFileSync } from "node:fs";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  ExtensionType,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

function loadKeypair(path: string): Keypair {
  const expanded = path.startsWith("~/")
    ? path.replace("~", process.env.HOME ?? "")
    : path;
  const raw = JSON.parse(readFileSync(expanded, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  const hookProgramIdRaw = process.env.HOOK_PROGRAM_ID;
  if (!hookProgramIdRaw) {
    throw new Error("Set HOOK_PROGRAM_ID to the deployed transfer-hook program ID.");
  }
  const hookProgramId = new PublicKey(hookProgramIdRaw);

  const connection = new Connection(
    process.env.RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed"
  );
  const payer = loadKeypair(
    process.env.PAYER_KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`
  );

  const mint = Keypair.generate();
  const decimals = 6;
  const extensions = [ExtensionType.TransferHook];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferHookInstruction(
      mint.publicKey,
      payer.publicKey, // hook authority
      hookProgramId,
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mint.publicKey,
      decimals,
      payer.publicKey,
      payer.publicKey,
      TOKEN_2022_PROGRAM_ID
    )
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [payer, mint], {
    commitment: "confirmed",
  });

  console.log("Mint created with TransferHook attached.");
  console.log("  mint:        ", mint.publicKey.toBase58());
  console.log("  hook program:", hookProgramId.toBase58());
  console.log("  signature:   ", sig);
  console.log("\nNext steps:");
  console.log(
    "  1. Call initialize_extra_account_meta_list(mint) on the hook program."
  );
  console.log(
    "  2. Mint tokens to a TavSin smart wallet PDA — every transfer will hit the hook."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
