import type { Program } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, type Connection, PublicKey } from "@solana/web3.js";

import {
  getAssetTrackerPda,
  getAuditPda,
  getCounterpartyPolicyPda,
  getLegacyTrackerPda,
  getPolicyPda,
  getRequestPda,
  NATIVE_MINT,
} from "./program";
import type {
  AuditEntryData,
  AssetSpendTrackerData,
  CounterpartyPolicyData,
  ExecutionRequestData,
  LegacySpendTrackerData,
  PendingApprovalItem,
  PolicyAccountData,
  QueryPage,
  WalletDetail,
  WalletSummary,
} from "./types";

async function fetchMaybe<T>(getter: () => Promise<T>): Promise<T | null> {
  try {
    return await getter();
  } catch {
    return null;
  }
}

function getProgramConnection(program: Program): Connection {
  return (program.provider as { connection: Connection }).connection;
}

function buildNewestFirstIds(total: number, offset: number, limit: number) {
  const start = Math.max(total - 1 - offset, -1);
  const end = Math.max(total - offset - limit, -1);
  const ids: number[] = [];

  for (let index = start; index > end; index -= 1) {
    ids.push(index);
  }

  return ids;
}

async function fetchDecodedAccounts<T>(
  program: Program,
  accountName: string,
  addresses: PublicKey[]
): Promise<(T | null)[]> {
  if (addresses.length === 0) {
    return [];
  }

  const infos = await getProgramConnection(program).getMultipleAccountsInfo(
    addresses
  );

  return infos.map((info) => {
    if (!info) {
      return null;
    }

    return (program.coder.accounts as any).decode(accountName, info.data) as T;
  });
}

async function fetchWalletRecordsForOwner(program: Program, owner: PublicKey) {
  return (program.account as any).smartWallet.all([
    {
      memcmp: {
        offset: 9,
        bytes: owner.toBase58(),
      },
    },
  ]);
}

export async function fetchCounterpartyPolicy(
  program: Program,
  walletPubkey: PublicKey,
  recipient: PublicKey
): Promise<CounterpartyPolicyData | null> {
  const [counterpartyPolicyPda] = getCounterpartyPolicyPda(
    walletPubkey,
    recipient
  );
  return fetchMaybe<CounterpartyPolicyData>(() =>
    (program.account as any).counterpartyPolicy.fetch(counterpartyPolicyPda)
  );
}

export async function fetchCounterpartyPoliciesForWallet(
  program: Program,
  walletPubkey: PublicKey
): Promise<CounterpartyPolicyData[]> {
  const policyRecords = await (program.account as any).counterpartyPolicy.all([
    {
      memcmp: {
        offset: 8,
        bytes: walletPubkey.toBase58(),
      },
    },
  ]);

  return policyRecords.map(
    (record: any) => record.account as CounterpartyPolicyData
  );
}

export async function fetchCounterpartyPoliciesForWalletPage(
  program: Program,
  walletPubkey: PublicKey,
  offset = 0,
  limit = 25,
  search?: string
): Promise<QueryPage<CounterpartyPolicyData>> {
  const normalizedSearch = search?.trim().toLowerCase();
  const records = await fetchCounterpartyPoliciesForWallet(
    program,
    walletPubkey
  );
  const filtered = normalizedSearch
    ? records.filter(
        (record) =>
          record.recipient
            .toBase58()
            .toLowerCase()
            .includes(normalizedSearch) ||
          record.allowedMints.some((mint) =>
            mint.toBase58().toLowerCase().includes(normalizedSearch)
          )
      )
    : records;
  const items = filtered
    .slice()
    .sort((left, right) =>
      left.recipient.toBase58().localeCompare(right.recipient.toBase58())
    )
    .slice(offset, offset + limit);

  return {
    items,
    total: filtered.length,
    offset,
    limit,
    hasMore: offset + limit < filtered.length,
  };
}

export async function fetchWalletsForOwner(
  program: Program,
  connection: Connection,
  owner: PublicKey
): Promise<WalletSummary[]> {
  const allWallets = await fetchWalletRecordsForOwner(program, owner);
  const walletPubkeys = allWallets.map(
    (walletRecord: any) => walletRecord.publicKey as PublicKey
  );
  const walletInfos = await connection.getMultipleAccountsInfo(walletPubkeys);
  const policyAddresses = walletPubkeys.map(
    (walletPubkey: PublicKey) => getPolicyPda(walletPubkey)[0]
  );
  const legacyTrackerAddresses = walletPubkeys.map(
    (walletPubkey: PublicKey) => getLegacyTrackerPda(walletPubkey)[0]
  );
  const nativeTrackerAddresses = walletPubkeys.map(
    (walletPubkey: PublicKey) =>
      getAssetTrackerPda(walletPubkey, NATIVE_MINT)[0]
  );
  const [policies, trackers, nativeAssetTrackers] = await Promise.all([
    fetchDecodedAccounts<PolicyAccountData>(program, "policy", policyAddresses),
    fetchDecodedAccounts<LegacySpendTrackerData>(
      program,
      "spendTracker",
      legacyTrackerAddresses
    ),
    fetchDecodedAccounts<AssetSpendTrackerData>(
      program,
      "assetSpendTracker",
      nativeTrackerAddresses
    ),
  ]);

  return allWallets.map((walletRecord: any, index: number) => ({
    publicKey: walletRecord.publicKey,
    account: walletRecord.account,
    balance: (walletInfos[index]?.lamports ?? 0) / LAMPORTS_PER_SOL,
    policy: policies[index],
    tracker: trackers[index],
    nativeAssetTracker: nativeAssetTrackers[index],
  }));
}

export async function fetchWalletsForOwnerPage(
  program: Program,
  connection: Connection,
  owner: PublicKey,
  offset = 0,
  limit = 25
): Promise<QueryPage<WalletSummary>> {
  const allWallets = await fetchWalletsForOwner(program, connection, owner);
  const items = allWallets.slice(offset, offset + limit);

  return {
    items,
    total: allWallets.length,
    offset,
    limit,
    hasMore: offset + limit < allWallets.length,
  };
}

export async function fetchAuditEntriesPage(
  program: Program,
  walletPubkey: PublicKey,
  offset = 0,
  limit = 25
): Promise<QueryPage<AuditEntryData>> {
  const walletData = await (program.account as any).smartWallet.fetch(
    walletPubkey
  );
  const total = walletData.nextAuditId.toNumber();
  const ids = buildNewestFirstIds(total, offset, limit);
  const addresses = ids.map((index) => getAuditPda(walletPubkey, index)[0]);
  const items = (
    await fetchDecodedAccounts<AuditEntryData>(program, "auditEntry", addresses)
  ).filter((entry): entry is AuditEntryData => entry !== null);

  return {
    items,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function fetchRequestsPage(
  program: Program,
  walletPubkey: PublicKey,
  offset = 0,
  limit = 25
): Promise<QueryPage<ExecutionRequestData>> {
  const walletData = await (program.account as any).smartWallet.fetch(
    walletPubkey
  );
  const total = walletData.nextRequestId.toNumber();
  const ids = buildNewestFirstIds(total, offset, limit);
  const addresses = ids.map((index) => getRequestPda(walletPubkey, index)[0]);
  const items = (
    await fetchDecodedAccounts<ExecutionRequestData>(
      program,
      "executionRequest",
      addresses
    )
  ).filter((request): request is ExecutionRequestData => request !== null);

  return {
    items,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function fetchPendingApprovalsForOwner(
  program: Program,
  connection: Connection,
  owner: PublicKey,
  offset = 0,
  limit = 25
): Promise<QueryPage<PendingApprovalItem>> {
  const walletRecords = await fetchWalletRecordsForOwner(program, owner);
  const pendingTarget = Math.max(offset + limit, 10);
  const pendingPages = await Promise.all(
    walletRecords
      .filter(
        (walletRecord: any) => walletRecord.account.totalPending.toNumber() > 0
      )
      .map(async (walletRecord: any) => {
        const requestsPage = await fetchRequestsPage(
          program,
          walletRecord.publicKey,
          0,
          pendingTarget
        );

        return requestsPage.items
          .filter((request) => request.status === 0)
          .map((request) => ({
            wallet: walletRecord.publicKey as PublicKey,
            owner: walletRecord.account.owner as PublicKey,
            agent: walletRecord.account.agent as PublicKey,
            request,
          }));
      })
  );
  const items = pendingPages
    .flat()
    .sort(
      (left, right) =>
        right.request.requestedAt.toNumber() -
        left.request.requestedAt.toNumber()
    )
    .slice(offset, offset + limit);
  const total = walletRecords.reduce(
    (sum: number, walletRecord: any) =>
      sum + walletRecord.account.totalPending.toNumber(),
    0
  );

  return {
    items,
    total,
    offset,
    limit,
    hasMore: offset + limit < total,
  };
}

export async function fetchWalletDetail(
  program: Program,
  connection: Connection,
  walletPubkey: PublicKey,
  maxEntries = 50
): Promise<WalletDetail> {
  const walletData = await (program.account as any).smartWallet.fetch(
    walletPubkey
  );
  const balance = await connection.getBalance(walletPubkey);
  const [policyPda] = getPolicyPda(walletPubkey);
  const [legacyTrackerPda] = getLegacyTrackerPda(walletPubkey);
  const [nativeAssetTrackerPda] = getAssetTrackerPda(walletPubkey, NATIVE_MINT);

  const policy = await fetchMaybe<PolicyAccountData>(() =>
    (program.account as any).policy.fetch(policyPda)
  );
  const tracker = await fetchMaybe<LegacySpendTrackerData>(() =>
    (program.account as any).spendTracker.fetch(legacyTrackerPda)
  );
  const nativeAssetTracker = await fetchMaybe<AssetSpendTrackerData>(() =>
    (program.account as any).assetSpendTracker.fetch(nativeAssetTrackerPda)
  );
  const [auditPage, requestPage] = await Promise.all([
    fetchAuditEntriesPage(program, walletPubkey, 0, maxEntries),
    fetchRequestsPage(program, walletPubkey, 0, maxEntries),
  ]);
  const requests = requestPage.items;

  return {
    walletAccount: {
      publicKey: walletPubkey,
      account: walletData,
      balance: balance / LAMPORTS_PER_SOL,
      policy,
      tracker,
      nativeAssetTracker,
    },
    policy,
    tracker,
    nativeAssetTracker,
    auditEntries: auditPage.items,
    requests,
    pendingRequests: requests.filter((request) => request.status === 0),
    auditCount: auditPage.total,
    requestCount: requestPage.total,
    hasMoreAuditEntries: auditPage.hasMore,
    hasMoreRequests: requestPage.hasMore,
  };
}
