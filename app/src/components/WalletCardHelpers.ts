import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export { lamportsToSol, shortenAddress } from "@tavsin/sdk";

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
  policy?: {
    maxPerTx: BN;
    maxDaily: BN;
    allowedPrograms: PublicKey[];
    timeWindowStart: BN | null;
    timeWindowEnd: BN | null;
  } | null;
  tracker?: {
    spentInPeriod: BN;
    periodStart: BN;
    periodDuration: BN;
  } | null;
}
