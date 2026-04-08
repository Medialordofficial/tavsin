"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import {
  getProgram,
  getWalletPda,
  getPolicyPda,
  getTrackerPda,
  getAuditPda,
  PROGRAM_ID,
} from "@/lib/program";

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
  balance: number; // in SOL
}

export interface PolicyAccount {
  maxPerTx: BN;
  maxDaily: BN;
  allowedPrograms: PublicKey[];
  timeWindowStart: BN | null;
  timeWindowEnd: BN | null;
}

export interface TrackerAccount {
  spentInPeriod: BN;
  periodStart: BN;
  periodDuration: BN;
}

export interface AuditEntryAccount {
  wallet: PublicKey;
  approved: boolean;
  amount: BN;
  targetProgram: PublicKey;
  denialReason: number;
  memo: string;
  timestamp: BN;
}

export function useTavsinProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;
  return getProgram(connection, wallet);
}

export function useWallets() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet) {
      setWallets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const program = getProgram(connection, wallet);

      // Fetch all SmartWallet accounts owned by connected wallet
      const allWallets = await (program.account as any).smartWallet.all([
        {
          memcmp: {
            offset: 8, // after discriminator
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ]);

      const walletsWithBalance = await Promise.all(
        allWallets.map(async (w: any) => {
          const balance = await connection.getBalance(w.publicKey);
          return {
            publicKey: w.publicKey,
            account: w.account,
            balance: balance / LAMPORTS_PER_SOL,
          };
        })
      );

      setWallets(walletsWithBalance);
    } catch (err: any) {
      console.error("Error fetching wallets:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { wallets, loading, error, refresh };
}

export function useWalletDetail(walletAddress: string | null) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [walletAccount, setWalletAccount] = useState<WalletAccount | null>(
    null
  );
  const [policy, setPolicy] = useState<PolicyAccount | null>(null);
  const [tracker, setTracker] = useState<TrackerAccount | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntryAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!anchorWallet || !walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const program = getProgram(connection, anchorWallet);
      const walletPubkey = new PublicKey(walletAddress);

      // Fetch wallet
      const walletData = await (program.account as any).smartWallet.fetch(
        walletPubkey
      );
      const balance = await connection.getBalance(walletPubkey);
      setWalletAccount({
        publicKey: walletPubkey,
        account: walletData,
        balance: balance / LAMPORTS_PER_SOL,
      });

      // Fetch policy
      const [policyPda] = getPolicyPda(walletPubkey);
      try {
        const policyData = await (program.account as any).policy.fetch(
          policyPda
        );
        setPolicy(policyData);
      } catch {
        setPolicy(null);
      }

      // Fetch tracker
      const [trackerPda] = getTrackerPda(walletPubkey);
      try {
        const trackerData = await (program.account as any).spendTracker.fetch(
          trackerPda
        );
        setTracker(trackerData);
      } catch {
        setTracker(null);
      }

      // Fetch audit entries
      const totalTx =
        walletData.totalApproved.toNumber() +
        walletData.totalDenied.toNumber();
      const entries: AuditEntryAccount[] = [];
      for (let i = 0; i < Math.min(totalTx, 50); i++) {
        try {
          const [auditPda] = getAuditPda(walletPubkey, i);
          const entry = await (program.account as any).auditEntry.fetch(
            auditPda
          );
          entries.push(entry);
        } catch {
          // Entry may not exist or be pruned
        }
      }
      setAuditEntries(entries.reverse()); // newest first
    } catch (err: any) {
      console.error("Error fetching wallet detail:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, anchorWallet, walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { walletAccount, policy, tracker, auditEntries, loading, error, refresh };
}
