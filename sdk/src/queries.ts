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
  PolicyAccountData,
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

export async function fetchCounterpartyPolicy(
  program: Program,
  walletPubkey: PublicKey,
  recipient: PublicKey
): Promise<CounterpartyPolicyData | null> {
  const [counterpartyPolicyPda] = getCounterpartyPolicyPda(walletPubkey, recipient);
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

  return policyRecords.map((record: any) => record.account as CounterpartyPolicyData);
}

export async function fetchWalletsForOwner(
  program: Program,
  connection: Connection,
  owner: PublicKey
): Promise<WalletSummary[]> {
  const allWallets = await (program.account as any).smartWallet.all([
    {
      memcmp: {
        offset: 9,
        bytes: owner.toBase58(),
      },
    },
  ]);

  return Promise.all(
    allWallets.map(async (walletRecord: any) => {
      const balance = await connection.getBalance(walletRecord.publicKey);
      const [policyPda] = getPolicyPda(walletRecord.publicKey);
      const [legacyTrackerPda] = getLegacyTrackerPda(walletRecord.publicKey);
      const [nativeAssetTrackerPda] = getAssetTrackerPda(walletRecord.publicKey, NATIVE_MINT);

      const policy = await fetchMaybe<PolicyAccountData>(() =>
        (program.account as any).policy.fetch(policyPda)
      );
      const tracker = await fetchMaybe<LegacySpendTrackerData>(() =>
        (program.account as any).spendTracker.fetch(legacyTrackerPda)
      );
      const nativeAssetTracker = await fetchMaybe<AssetSpendTrackerData>(() =>
        (program.account as any).assetSpendTracker.fetch(nativeAssetTrackerPda)
      );

      return {
        publicKey: walletRecord.publicKey,
        account: walletRecord.account,
        balance: balance / LAMPORTS_PER_SOL,
        policy,
        tracker,
        nativeAssetTracker,
      };
    })
  );
}

export async function fetchWalletDetail(
  program: Program,
  connection: Connection,
  walletPubkey: PublicKey,
  maxEntries = 50
): Promise<WalletDetail> {
  const walletData = await (program.account as any).smartWallet.fetch(walletPubkey);
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

  const auditEntries: AuditEntryData[] = [];
  const totalAudits = Math.min(walletData.nextAuditId.toNumber(), maxEntries);
  for (let index = 0; index < totalAudits; index += 1) {
    const [auditPda] = getAuditPda(walletPubkey, index);
    const entry = await fetchMaybe<AuditEntryData>(() =>
      (program.account as any).auditEntry.fetch(auditPda)
    );
    if (entry) {
      auditEntries.push(entry);
    }
  }

  const requests: ExecutionRequestData[] = [];
  const totalRequests = Math.min(walletData.nextRequestId.toNumber(), maxEntries);
  for (let index = 0; index < totalRequests; index += 1) {
    const [requestPda] = getRequestPda(walletPubkey, index);
    const request = await fetchMaybe<ExecutionRequestData>(() =>
      (program.account as any).executionRequest.fetch(requestPda)
    );
    if (request) {
      requests.push(request);
    }
  }

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
    auditEntries: auditEntries.reverse(),
    requests: requests.reverse(),
    pendingRequests: requests.filter((request) => request.status === 0).reverse(),
  };
}