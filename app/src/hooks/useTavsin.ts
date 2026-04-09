"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  type CounterpartyPolicyData,
  type AssetSpendTrackerData,
  type AuditEntryData,
  type ExecutionRequestData,
  fetchCounterpartyPoliciesForWallet,
  fetchWalletDetail,
  fetchWalletsForOwner,
  getProgram,
  type LegacySpendTrackerData,
  type PolicyAccountData,
  type WalletSummary,
} from "@/lib/program";

export type WalletAccount = WalletSummary;
export type PolicyAccount = PolicyAccountData;
export type TrackerAccount = LegacySpendTrackerData;
export type AuditEntryAccount = AuditEntryData;
export type RequestAccount = ExecutionRequestData;
export type AssetTrackerAccount = AssetSpendTrackerData;
export type CounterpartyPolicyAccount = CounterpartyPolicyData;

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
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

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
      setWallets(await fetchWalletsForOwner(program as any, connection, wallet.publicKey));
      setLastSyncedAt(Date.now());
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

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  return { wallets, loading, error, refresh, lastSyncedAt };
}

export function useWalletDetail(walletAddress: string | null) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [walletAccount, setWalletAccount] = useState<WalletAccount | null>(
    null
  );
  const [policy, setPolicy] = useState<PolicyAccount | null>(null);
  const [tracker, setTracker] = useState<TrackerAccount | null>(null);
  const [nativeAssetTracker, setNativeAssetTracker] = useState<AssetTrackerAccount | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntryAccount[]>([]);
  const [requests, setRequests] = useState<RequestAccount[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RequestAccount[]>([]);
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
      const detail = await fetchWalletDetail(program as any, connection, walletPubkey);

      setWalletAccount(detail.walletAccount);
      setPolicy(detail.policy);
      setTracker(detail.tracker);
      setNativeAssetTracker(detail.nativeAssetTracker);
      setAuditEntries(detail.auditEntries);
      setRequests(detail.requests);
      setPendingRequests(detail.pendingRequests);
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

  return {
    walletAccount,
    policy,
    tracker,
    nativeAssetTracker,
    auditEntries,
    requests,
    pendingRequests,
    loading,
    error,
    refresh,
  };
}

export function useCounterpartyPolicies(walletAddress: string | null) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [policies, setPolicies] = useState<CounterpartyPolicyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!anchorWallet || !walletAddress) {
      setPolicies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const program = getProgram(connection, anchorWallet);
      const walletPubkey = new PublicKey(walletAddress);
      setPolicies(await fetchCounterpartyPoliciesForWallet(program as any, walletPubkey));
    } catch (err: any) {
      console.error("Error fetching counterparty policies:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, anchorWallet, walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    policies,
    loading,
    error,
    refresh,
  };
}
