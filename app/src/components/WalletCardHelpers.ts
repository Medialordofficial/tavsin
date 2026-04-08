import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export interface WalletAccount {
  publicKey: PublicKey;
  account: {
    owner: PublicKey;
    agent: PublicKey;
    frozen: boolean;
    bump: number;
    totalApproved: BN;
    totalDenied: BN;
    createdAt: BN;
  };
  balance: number;
}

const LAMPORTS = 1_000_000_000;

export function lamportsToSol(lamports: number): string {
  return (lamports / LAMPORTS).toFixed(4);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
