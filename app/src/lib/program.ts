import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

// IDL import
import idlJson from "./tavsin_idl.json";

export const PROGRAM_ID = new PublicKey(
  "2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy"
);

export const WALLET_SEED = Buffer.from("wallet");
export const POLICY_SEED = Buffer.from("policy");
export const TRACKER_SEED = Buffer.from("tracker");
export const AUDIT_SEED = Buffer.from("audit");

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idlJson as any, provider);
}

export function getWalletPda(owner: PublicKey, agent: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [WALLET_SEED, owner.toBuffer(), agent.toBuffer()],
    PROGRAM_ID
  );
}

export function getPolicyPda(walletPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [POLICY_SEED, walletPda.toBuffer()],
    PROGRAM_ID
  );
}

export function getTrackerPda(walletPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [TRACKER_SEED, walletPda.toBuffer()],
    PROGRAM_ID
  );
}

export function getAuditPda(walletPda: PublicKey, txCount: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(txCount));
  return PublicKey.findProgramAddressSync(
    [AUDIT_SEED, walletPda.toBuffer(), buf],
    PROGRAM_ID
  );
}

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export const DENIAL_REASONS: Record<number, string> = {
  0: "Approved",
  1: "Exceeds per-tx limit",
  2: "Exceeds daily budget",
  3: "Program not allowed",
  4: "Outside time window",
  5: "Wallet frozen",
};
