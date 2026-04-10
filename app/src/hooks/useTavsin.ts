"use client";

import { useEffect, useState, useCallback } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  type CounterpartyPolicyData,
  type AssetSpendTrackerData,
  type AuditEntryData,
  type ExecutionRequestData,
  type LegacySpendTrackerData,
  type PendingApprovalItem,
  type PolicyAccountData,
  type WalletSummary,
} from "@tavsin/sdk";
import { getProgram } from "@/lib/program";
import {
  hydrateAuditEntriesPage,
  hydrateCounterpartyPoliciesPage,
  hydratePendingApprovalsPage,
  hydrateRequestsPage,
  hydrateWalletDetail,
  hydrateWalletsPage,
  type SerializedAuditEntryData,
  type SerializedCounterpartyPolicyData,
  type SerializedExecutionRequestData,
  type SerializedPendingApprovalItem,
  type SerializedQueryPage,
  type SerializedWalletDetail,
  type SerializedWalletSummary,
} from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";

export type WalletAccount = WalletSummary;
export type PolicyAccount = PolicyAccountData;
export type TrackerAccount = LegacySpendTrackerData;
export type AuditEntryAccount = AuditEntryData;
export type RequestAccount = ExecutionRequestData;
export type AssetTrackerAccount = AssetSpendTrackerData;
export type CounterpartyPolicyAccount = CounterpartyPolicyData;
export type PendingApprovalAccount = PendingApprovalItem;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload as T;
}

export function useTavsinProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  if (!wallet) return null;
  return getProgram(connection, wallet);
}

export function useWallets() {
  const wallet = useAnchorWallet();
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 24;

  const refresh = useCallback(async () => {
    if (!wallet) {
      setWallets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const page = hydrateWalletsPage(
        await fetchJson<SerializedQueryPage<SerializedWalletSummary>>(
          `/api/wallets?owner=${encodeURIComponent(
            wallet.publicKey.toBase58()
          )}&limit=${pageSize}`
        )
      );
      setWallets(page.items);
      setTotal(page.total);
      setHasMore(page.hasMore);
      setLastSyncedAt(Date.now());
    } catch (err: unknown) {
      console.error("Error fetching wallets:", err);
      setError(getErrorMessage(err, "Unable to fetch wallets"));
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const loadMore = useCallback(async () => {
    if (!wallet || loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      const page = hydrateWalletsPage(
        await fetchJson<SerializedQueryPage<SerializedWalletSummary>>(
          `/api/wallets?owner=${encodeURIComponent(
            wallet.publicKey.toBase58()
          )}&offset=${wallets.length}&limit=${pageSize}`
        )
      );
      setWallets((current) => [...current, ...page.items]);
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch (err: unknown) {
      console.error("Error loading more wallets:", err);
      setError(getErrorMessage(err, "Unable to load more wallets"));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, wallet, wallets.length]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  return {
    wallets,
    total,
    hasMore,
    loadingMore,
    loading,
    error,
    refresh,
    loadMore,
    lastSyncedAt,
  };
}

export function useWalletDetail(walletAddress: string | null) {
  const [walletAccount, setWalletAccount] = useState<WalletAccount | null>(
    null
  );
  const [policy, setPolicy] = useState<PolicyAccount | null>(null);
  const [tracker, setTracker] = useState<TrackerAccount | null>(null);
  const [nativeAssetTracker, setNativeAssetTracker] =
    useState<AssetTrackerAccount | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntryAccount[]>([]);
  const [requests, setRequests] = useState<RequestAccount[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RequestAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditCount, setAuditCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [hasMoreAuditEntries, setHasMoreAuditEntries] = useState(false);
  const [hasMoreRequests, setHasMoreRequests] = useState(false);
  const [loadingMoreAuditEntries, setLoadingMoreAuditEntries] = useState(false);
  const [loadingMoreRequests, setLoadingMoreRequests] = useState(false);
  const activityPageSize = 50;

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const detail = hydrateWalletDetail(
        await fetchJson<SerializedWalletDetail>(
          `/api/wallets/${encodeURIComponent(walletAddress)}?limit=50`
        )
      );

      setWalletAccount(detail.walletAccount);
      setPolicy(detail.policy);
      setTracker(detail.tracker);
      setNativeAssetTracker(detail.nativeAssetTracker);
      setAuditEntries(detail.auditEntries);
      setRequests(detail.requests);
      setPendingRequests(detail.pendingRequests);
      setAuditCount(detail.auditCount);
      setRequestCount(detail.requestCount);
      setHasMoreAuditEntries(detail.hasMoreAuditEntries);
      setHasMoreRequests(detail.hasMoreRequests);
    } catch (err: unknown) {
      console.error("Error fetching wallet detail:", err);
      setError(getErrorMessage(err, "Unable to fetch wallet detail"));
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadMoreAuditEntries = useCallback(async () => {
    if (!walletAddress || loadingMoreAuditEntries || !hasMoreAuditEntries) {
      return;
    }

    try {
      setLoadingMoreAuditEntries(true);
      const page = hydrateAuditEntriesPage(
        await fetchJson<SerializedQueryPage<SerializedAuditEntryData>>(
          `/api/wallets/${encodeURIComponent(walletAddress)}/audit?offset=${
            auditEntries.length
          }&limit=${activityPageSize}`
        )
      );
      setAuditEntries((current) => [...current, ...page.items]);
      setAuditCount(page.total);
      setHasMoreAuditEntries(page.hasMore);
    } catch (err: unknown) {
      console.error("Error loading more audit entries:", err);
      setError(getErrorMessage(err, "Unable to load more audit entries"));
    } finally {
      setLoadingMoreAuditEntries(false);
    }
  }, [
    activityPageSize,
    auditEntries.length,
    hasMoreAuditEntries,
    loadingMoreAuditEntries,
    walletAddress,
  ]);

  const loadMoreRequests = useCallback(async () => {
    if (!walletAddress || loadingMoreRequests || !hasMoreRequests) {
      return;
    }

    try {
      setLoadingMoreRequests(true);
      const page = hydrateRequestsPage(
        await fetchJson<SerializedQueryPage<SerializedExecutionRequestData>>(
          `/api/wallets/${encodeURIComponent(walletAddress)}/requests?offset=${
            requests.length
          }&limit=${activityPageSize}`
        )
      );
      setRequests((current) => {
        const next = [...current, ...page.items];
        setPendingRequests(next.filter((request) => request.status === 0));
        return next;
      });
      setRequestCount(page.total);
      setHasMoreRequests(page.hasMore);
    } catch (err: unknown) {
      console.error("Error loading more requests:", err);
      setError(getErrorMessage(err, "Unable to load more requests"));
    } finally {
      setLoadingMoreRequests(false);
    }
  }, [
    activityPageSize,
    hasMoreRequests,
    loadingMoreRequests,
    requests.length,
    walletAddress,
  ]);

  return {
    walletAccount,
    policy,
    tracker,
    nativeAssetTracker,
    auditEntries,
    requests,
    pendingRequests,
    auditCount,
    requestCount,
    hasMoreAuditEntries,
    hasMoreRequests,
    loadingMoreAuditEntries,
    loadingMoreRequests,
    loading,
    error,
    refresh,
    loadMoreAuditEntries,
    loadMoreRequests,
  };
}

export function useCounterpartyPolicies(walletAddress: string | null) {
  const [policies, setPolicies] = useState<CounterpartyPolicyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setPolicies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const page = hydrateCounterpartyPoliciesPage(
        await fetchJson<SerializedQueryPage<SerializedCounterpartyPolicyData>>(
          `/api/wallets/${encodeURIComponent(
            walletAddress
          )}/counterparties?limit=200`
        )
      );
      setPolicies(page.items);
    } catch (err: unknown) {
      console.error("Error fetching counterparty policies:", err);
      setError(getErrorMessage(err, "Unable to fetch counterparty policies"));
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

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

export function usePendingApprovalQueue() {
  const wallet = useAnchorWallet();
  const [items, setItems] = useState<PendingApprovalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 12;

  const refresh = useCallback(async () => {
    if (!wallet) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const page = hydratePendingApprovalsPage(
        await fetchJson<SerializedQueryPage<SerializedPendingApprovalItem>>(
          `/api/owners/${encodeURIComponent(
            wallet.publicKey.toBase58()
          )}/pending-requests?limit=${pageSize}`
        )
      );
      setItems(page.items);
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch (err: unknown) {
      console.error("Error fetching pending approvals:", err);
      setError(getErrorMessage(err, "Unable to fetch pending approvals"));
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const loadMore = useCallback(async () => {
    if (!wallet || loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      const page = hydratePendingApprovalsPage(
        await fetchJson<SerializedQueryPage<SerializedPendingApprovalItem>>(
          `/api/owners/${encodeURIComponent(
            wallet.publicKey.toBase58()
          )}/pending-requests?offset=${items.length}&limit=${pageSize}`
        )
      );
      setItems((current) => [...current, ...page.items]);
      setTotal(page.total);
      setHasMore(page.hasMore);
    } catch (err: unknown) {
      console.error("Error loading more pending approvals:", err);
      setError(getErrorMessage(err, "Unable to load more pending approvals"));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, items.length, loadingMore, wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items,
    total,
    hasMore,
    loadingMore,
    loading,
    error,
    refresh,
    loadMore,
  };
}
