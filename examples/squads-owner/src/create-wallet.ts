/**
 * Create a TavSin smart wallet whose `owner` is a Squads V4 vault PDA.
 *
 * Pre-reqs:
 *   - SQUADS_MULTISIG env: pubkey of an existing Squads V4 multisig (devnet)
 *   - AGENT_KEYPAIR env:   path to a JSON keypair file for the AI agent
 *   - solana CLI default keypair funded on devnet (pays tx fees)
 *
 * Run:
 *   SQUADS_MULTISIG=... AGENT_KEYPAIR=./agent.json npm run create-wallet
 *
 * NOTE: this is an executable example. To keep CI fast it is NOT wired to
 * `npm run typecheck` — it depends on `@sqds/multisig` which is added on
 * demand by `npm install` in this folder.
 */

import { readFileSync } from "node:fs";
import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
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
  const agentKeypairPath = process.env.AGENT_KEYPAIR;
  if (!multisigPubkeyEnv || !agentKeypairPath) {
    throw new Error(
      "Set SQUADS_MULTISIG=<pubkey> and AGENT_KEYPAIR=<path/to/keypair.json>"
    );
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

  // 1) Derive the Squads vault PDA — this is what TavSin sees as `owner`.
  //    Vault index 0 is the default for new multisigs.
  const multisigPda = new PublicKey(multisigPubkeyEnv);
  const [vaultPda] = multisig.getVaultPda({
    multisigPda,
    index: 0,
  });

  console.log("Squads multisig:", multisigPda.toBase58());
  console.log("Squads vault PDA (TavSin owner):", vaultPda.toBase58());

  // 2) Load the agent keypair. The agent will sign every submit_request /
  //    execute_request, but is bounded by policy and the vault.
  const agent = loadKeypair(agentKeypairPath);
  console.log("Agent pubkey:", agent.publicKey.toBase58());

  // 3) Derive the TavSin PDAs.
  const [walletPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("wallet"), vaultPda.toBuffer(), agent.publicKey.toBuffer()],
    PROGRAM_ID
  );
  const [policyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), walletPda.toBuffer()],
    PROGRAM_ID
  );
  const [trackerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tracker"), walletPda.toBuffer()],
    PROGRAM_ID
  );

  console.log("TavSin wallet PDA:", walletPda.toBase58());
  console.log("TavSin policy PDA:", policyPda.toBase58());

  // 4) Build the createWallet ix. The vault PDA is the `owner` Signer.
  //    Because the vault PDA cannot sign on its own, this ix has to be
  //    proposed THROUGH Squads — see approve-via-squads.ts for the
  //    proposal pattern. For a standalone demo we instead use a member
  //    of the multisig with execute-permission to push it through.
  const createIx = await program.methods
    .createWallet(
      new BN(0.5 * LAMPORTS_PER_SOL), // max per tx
      new BN(2 * LAMPORTS_PER_SOL),   // max daily
      [],                              // allowed_programs (open)
      null,                            // time window start
      null                             // time window end
    )
    .accounts({
      owner: vaultPda,                 // <— the Squads vault PDA
      agent: agent.publicKey,
      wallet: walletPda,
      policy: policyPda,
      tracker: trackerPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  console.log("\nNext step: wrap this ix in a Squads vault_transaction_create");
  console.log("call so the multisig members can vote on it. The vault PDA");
  console.log("will sign automatically on execute.\n");
  console.log("createWallet ix data length:", createIx.data.length);
  console.log("Accounts:", createIx.keys.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
