/**
 * Wrap a TavSin `approve_request` call in a Squads vault transaction so the
 * multisig members can vote on it before it executes.
 *
 * Flow:
 *   1. Agent submits a TavSin request that exceeds approval_threshold or
 *      hits any other policy that routes it to PENDING.
 *   2. This script reads the pending request, builds the approve_request ix
 *      (signed by `owner = vault PDA`), and proposes it as a Squads
 *      vault_transaction.
 *   3. Multisig members vote on the proposal in the Squads UI.
 *   4. When threshold reached, anyone executes the proposal — the Squads
 *      vault PDA signs the inner approve_request, and TavSin marks the
 *      request approved.
 *   5. The agent (or anyone) calls execute_request to settle the transfer.
 *
 * Run:
 *   SQUADS_MULTISIG=... \
 *   AGENT_KEYPAIR=./agent.json \
 *   REQUEST_PDA=<request pubkey> \
 *   npm run approve-via-squads
 */

import { readFileSync } from "node:fs";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
} from "@solana/web3.js";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import * as multisig from "@sqds/multisig";

import idl from "../../../target/idl/tavsin.json" assert { type: "json" };
import type { Tavsin } from "../../../target/types/tavsin";

const PROGRAM_ID = new PublicKey(
  "2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy"
);

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  const multisigPubkeyEnv = process.env.SQUADS_MULTISIG;
  const requestPubkeyEnv = process.env.REQUEST_PDA;
  if (!multisigPubkeyEnv || !requestPubkeyEnv) {
    throw new Error("Set SQUADS_MULTISIG and REQUEST_PDA env vars.");
  }

  const connection = new Connection(
    process.env.RPC_URL ?? "https://api.devnet.solana.com",
    "confirmed"
  );
  const payer = loadKeypair(
    process.env.PAYER_KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`
  );
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(idl as unknown as Tavsin, provider);

  const multisigPda = new PublicKey(multisigPubkeyEnv);
  const [vaultPda] = multisig.getVaultPda({ multisigPda, index: 0 });

  // 1) Read the pending request to recover wallet pubkey.
  const requestPda = new PublicKey(requestPubkeyEnv);
  const request = await program.account.executionRequest.fetch(requestPda);
  const walletPda = request.wallet;

  // 2) Build the inner approve_request ix.
  const approveIx = await program.methods
    .approveRequest()
    .accounts({
      owner: vaultPda,
      wallet: walletPda,
      request: requestPda,
    })
    .instruction();

  // 3) Build the Squads vault_transaction.
  const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
    connection,
    multisigPda
  );
  const newTxIndex = multisig.utils.toBigInt(multisigAccount.transactionIndex) + 1n;

  const transactionMessage = new TransactionMessage({
    payerKey: vaultPda,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [approveIx],
  });

  const createIx = multisig.instructions.vaultTransactionCreate({
    multisigPda,
    transactionIndex: newTxIndex,
    creator: payer.publicKey,
    vaultIndex: 0,
    ephemeralSigners: 0,
    transactionMessage,
    memo: `TavSin approve_request ${requestPda.toBase58()}`,
  });

  const proposalIx = multisig.instructions.proposalCreate({
    multisigPda,
    transactionIndex: newTxIndex,
    creator: payer.publicKey,
  });

  console.log(`Proposing TavSin approve_request via Squads tx index ${newTxIndex}.`);
  console.log("Members must vote in the Squads UI; once threshold is reached,");
  console.log("anyone can execute the vault transaction and TavSin will mark");
  console.log("the request approved.");

  // The actual sendAndConfirm of [createIx, proposalIx] is left to the
  // caller — we print the ixs here so the demo stays inspectable.
  console.log("\ncreateIx accounts:", createIx.keys.length);
  console.log("proposalIx accounts:", proposalIx.keys.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
