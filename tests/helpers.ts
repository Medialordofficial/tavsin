import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { createHash } from "crypto";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import { Tavsin } from "../target/types/tavsin";

export const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

export const program = anchor.workspace.tavsin as Program<Tavsin>;
export const owner = provider.wallet;
export const nativeMint = new PublicKey(new Uint8Array(32));

export type WalletFixture = {
  agent: Keypair;
  recipient: Keypair;
  alternateRecipient: Keypair;
  walletPda: PublicKey;
  policyPda: PublicKey;
  legacyTrackerPda: PublicKey;
  counterpartyPolicyPda: PublicKey;
};

export function getAuditPda(walletPda: PublicKey, auditId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(auditId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("audit"), walletPda.toBuffer(), buf],
    program.programId
  );
}

export function getRequestPda(walletPda: PublicKey, requestId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(requestId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("request"), walletPda.toBuffer(), buf],
    program.programId
  );
}

export function getAssetTrackerPda(walletPda: PublicKey, assetMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("tracker"), walletPda.toBuffer(), assetMint.toBuffer()],
    program.programId
  );
}

export function getCounterpartyPolicyPda(
  walletPda: PublicKey,
  recipient: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("counterparty"), walletPda.toBuffer(), recipient.toBuffer()],
    program.programId
  );
}

export async function fetchWalletAccount(walletPda: PublicKey) {
  return program.account.smartWallet.fetch(walletPda);
}

export async function nextAuditPda(walletPda: PublicKey): Promise<PublicKey> {
  const wallet = await fetchWalletAccount(walletPda);
  const [auditPda] = getAuditPda(walletPda, wallet.nextAuditId.toNumber());
  return auditPda;
}

export async function nextRequestPda(walletPda: PublicKey): Promise<PublicKey> {
  const wallet = await fetchWalletAccount(walletPda);
  const [requestPda] = getRequestPda(walletPda, wallet.nextRequestId.toNumber());
  return requestPda;
}

export function hashInstructionData(data: Buffer): number[] {
  return [...createHash("sha256").update(data).digest()];
}

export function hashRemainingAccounts(
  accounts: Array<{ pubkey: PublicKey; isWritable: boolean; isSigner: boolean }>
): number[] {
  const encoded = Buffer.concat(
    accounts.map((account) =>
      Buffer.concat([
        account.pubkey.toBuffer(),
        Buffer.from([account.isWritable ? 1 : 0, account.isSigner ? 1 : 0]),
      ])
    )
  );

  return [...createHash("sha256").update(encoded).digest()];
}

export function normalizeWalletSignedAccounts(
  accounts: Array<{ pubkey: PublicKey; isWritable: boolean; isSigner: boolean }>,
  walletPda: PublicKey
) {
  return accounts.map((account) =>
    account.pubkey.equals(walletPda)
      ? { ...account, isWritable: true, isSigner: false }
      : account
  );
}

export async function buildWalletFixture(): Promise<WalletFixture> {
  const agent = Keypair.generate();
  const recipient = Keypair.generate();
  const alternateRecipient = Keypair.generate();

  const [walletPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("wallet"), owner.publicKey.toBuffer(), agent.publicKey.toBuffer()],
    program.programId
  );
  const [policyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("policy"), walletPda.toBuffer()],
    program.programId
  );
  const [legacyTrackerPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tracker"), walletPda.toBuffer()],
    program.programId
  );
  const [counterpartyPolicyPda] = getCounterpartyPolicyPda(walletPda, recipient.publicKey);

  const sig = await provider.connection.requestAirdrop(agent.publicKey, 2 * LAMPORTS_PER_SOL);
  await provider.connection.confirmTransaction(sig);

  await program.methods
    .createWallet(new anchor.BN(LAMPORTS_PER_SOL), new anchor.BN(5 * LAMPORTS_PER_SOL), [], null, null)
    .accounts({
      owner: owner.publicKey,
      agent: agent.publicKey,
      wallet: walletPda,
      policy: policyPda,
      tracker: legacyTrackerPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  await program.methods
    .fundWallet(new anchor.BN(10 * LAMPORTS_PER_SOL))
    .accounts({
      owner: owner.publicKey,
      wallet: walletPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    agent,
    recipient,
    alternateRecipient,
    walletPda,
    policyPda,
    legacyTrackerPda,
    counterpartyPolicyPda,
  };
}