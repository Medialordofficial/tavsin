import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type {
  AssetSpendTrackerData,
  AuditEntryData,
  CounterpartyPolicyData,
  ExecutionRequestData,
  LegacySpendTrackerData,
  PendingApprovalItem,
  PolicyAccountData,
  QueryPage,
  SmartWalletAccountData,
  WalletDetail,
  WalletSummary,
} from "@tavsin/sdk";

type SerializedBN = string;
type SerializedPublicKey = string;

export interface SerializedSmartWalletAccountData {
  version: number;
  owner: SerializedPublicKey;
  agent: SerializedPublicKey;
  frozen: boolean;
  bump: number;
  nextRequestId: SerializedBN;
  nextAuditId: SerializedBN;
  totalApproved: SerializedBN;
  totalDenied: SerializedBN;
  totalPending: SerializedBN;
  createdAt: SerializedBN;
}

export interface SerializedMintRuleData {
  mint: SerializedPublicKey;
  maxPerTx: SerializedBN;
  maxDaily: SerializedBN;
  requireApprovalAbove: SerializedBN | null;
}

export interface SerializedPolicyAccountData {
  version: number;
  wallet: SerializedPublicKey;
  maxPerTx: SerializedBN;
  maxDaily: SerializedBN;
  approvalThreshold: SerializedBN | null;
  requireApprovalForNewRecipients: boolean;
  allowedPrograms: SerializedPublicKey[];
  allowedRecipients: SerializedPublicKey[];
  blockedMints: SerializedPublicKey[];
  mintRules: SerializedMintRuleData[];
  timeWindowStart: SerializedBN | null;
  timeWindowEnd: SerializedBN | null;
}

export interface SerializedLegacySpendTrackerData {
  wallet: SerializedPublicKey;
  spentInPeriod: SerializedBN;
  periodStart: SerializedBN;
  periodDuration: SerializedBN;
}

export interface SerializedAssetSpendTrackerData {
  wallet: SerializedPublicKey;
  assetMint: SerializedPublicKey;
  spentInPeriod: SerializedBN;
  periodStart: SerializedBN;
  periodDuration: SerializedBN;
}

export interface SerializedCounterpartyPolicyData {
  wallet: SerializedPublicKey;
  recipient: SerializedPublicKey;
  enabled: boolean;
  requireApproval: boolean;
  maxPerTxOverride: SerializedBN | null;
  dailyLimitOverride: SerializedBN | null;
  allowedMints: SerializedPublicKey[];
}

export interface SerializedExecutionRequestData {
  wallet: SerializedPublicKey;
  requestId: SerializedBN;
  agent: SerializedPublicKey;
  targetProgram: SerializedPublicKey;
  recipient: SerializedPublicKey;
  assetMint: SerializedPublicKey;
  amount: SerializedBN;
  status: number;
  instructionHash: number[];
  accountsHash: number[];
  memo: string;
  requestedAt: SerializedBN;
  expiresAt: SerializedBN | null;
  reviewedBy: SerializedPublicKey | null;
  reviewedAt: SerializedBN | null;
}

export interface SerializedAuditEntryData {
  wallet: SerializedPublicKey;
  requestId: SerializedBN;
  approved: boolean;
  outcome: number;
  amount: SerializedBN;
  assetMint: SerializedPublicKey;
  targetProgram: SerializedPublicKey;
  recipient: SerializedPublicKey;
  denialReason: number;
  memo: string;
  timestamp: SerializedBN;
}

export interface SerializedWalletSummary {
  publicKey: SerializedPublicKey;
  account: SerializedSmartWalletAccountData;
  balance: number;
  policy: SerializedPolicyAccountData | null;
  tracker: SerializedLegacySpendTrackerData | null;
  nativeAssetTracker: SerializedAssetSpendTrackerData | null;
}

export interface SerializedWalletDetail {
  walletAccount: SerializedWalletSummary | null;
  policy: SerializedPolicyAccountData | null;
  tracker: SerializedLegacySpendTrackerData | null;
  nativeAssetTracker: SerializedAssetSpendTrackerData | null;
  auditEntries: SerializedAuditEntryData[];
  requests: SerializedExecutionRequestData[];
  pendingRequests: SerializedExecutionRequestData[];
  auditCount: number;
  requestCount: number;
  hasMoreAuditEntries: boolean;
  hasMoreRequests: boolean;
}

export interface SerializedPendingApprovalItem {
  wallet: SerializedPublicKey;
  owner: SerializedPublicKey;
  agent: SerializedPublicKey;
  request: SerializedExecutionRequestData;
}

export interface SerializedQueryPage<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

function serializePublicKey(value: PublicKey) {
  return value.toBase58();
}

function serializeBn(value: BN) {
  return value.toString();
}

function deserializePublicKey(value: string) {
  return new PublicKey(value);
}

function deserializeBn(value: string) {
  return new BN(value);
}

function serializeSmartWalletAccount(
  account: SmartWalletAccountData
): SerializedSmartWalletAccountData {
  return {
    version: account.version,
    owner: serializePublicKey(account.owner),
    agent: serializePublicKey(account.agent),
    frozen: account.frozen,
    bump: account.bump,
    nextRequestId: serializeBn(account.nextRequestId),
    nextAuditId: serializeBn(account.nextAuditId),
    totalApproved: serializeBn(account.totalApproved),
    totalDenied: serializeBn(account.totalDenied),
    totalPending: serializeBn(account.totalPending),
    createdAt: serializeBn(account.createdAt),
  };
}

function deserializeSmartWalletAccount(
  account: SerializedSmartWalletAccountData
): SmartWalletAccountData {
  return {
    version: account.version,
    owner: deserializePublicKey(account.owner),
    agent: deserializePublicKey(account.agent),
    frozen: account.frozen,
    bump: account.bump,
    nextRequestId: deserializeBn(account.nextRequestId),
    nextAuditId: deserializeBn(account.nextAuditId),
    totalApproved: deserializeBn(account.totalApproved),
    totalDenied: deserializeBn(account.totalDenied),
    totalPending: deserializeBn(account.totalPending),
    createdAt: deserializeBn(account.createdAt),
  };
}

function serializePolicy(
  policy: PolicyAccountData
): SerializedPolicyAccountData {
  return {
    version: policy.version,
    wallet: serializePublicKey(policy.wallet),
    maxPerTx: serializeBn(policy.maxPerTx),
    maxDaily: serializeBn(policy.maxDaily),
    approvalThreshold: policy.approvalThreshold
      ? serializeBn(policy.approvalThreshold)
      : null,
    requireApprovalForNewRecipients: policy.requireApprovalForNewRecipients,
    allowedPrograms: policy.allowedPrograms.map(serializePublicKey),
    allowedRecipients: policy.allowedRecipients.map(serializePublicKey),
    blockedMints: policy.blockedMints.map(serializePublicKey),
    mintRules: policy.mintRules.map((rule) => ({
      mint: serializePublicKey(rule.mint),
      maxPerTx: serializeBn(rule.maxPerTx),
      maxDaily: serializeBn(rule.maxDaily),
      requireApprovalAbove: rule.requireApprovalAbove
        ? serializeBn(rule.requireApprovalAbove)
        : null,
    })),
    timeWindowStart: policy.timeWindowStart
      ? serializeBn(policy.timeWindowStart)
      : null,
    timeWindowEnd: policy.timeWindowEnd
      ? serializeBn(policy.timeWindowEnd)
      : null,
  };
}

function deserializePolicy(
  policy: SerializedPolicyAccountData
): PolicyAccountData {
  return {
    version: policy.version,
    wallet: deserializePublicKey(policy.wallet),
    maxPerTx: deserializeBn(policy.maxPerTx),
    maxDaily: deserializeBn(policy.maxDaily),
    approvalThreshold: policy.approvalThreshold
      ? deserializeBn(policy.approvalThreshold)
      : null,
    requireApprovalForNewRecipients: policy.requireApprovalForNewRecipients,
    allowedPrograms: policy.allowedPrograms.map(deserializePublicKey),
    allowedRecipients: policy.allowedRecipients.map(deserializePublicKey),
    blockedMints: policy.blockedMints.map(deserializePublicKey),
    mintRules: policy.mintRules.map((rule) => ({
      mint: deserializePublicKey(rule.mint),
      maxPerTx: deserializeBn(rule.maxPerTx),
      maxDaily: deserializeBn(rule.maxDaily),
      requireApprovalAbove: rule.requireApprovalAbove
        ? deserializeBn(rule.requireApprovalAbove)
        : null,
    })),
    timeWindowStart: policy.timeWindowStart
      ? deserializeBn(policy.timeWindowStart)
      : null,
    timeWindowEnd: policy.timeWindowEnd
      ? deserializeBn(policy.timeWindowEnd)
      : null,
  };
}

function serializeTracker(
  tracker: LegacySpendTrackerData
): SerializedLegacySpendTrackerData {
  return {
    wallet: serializePublicKey(tracker.wallet),
    spentInPeriod: serializeBn(tracker.spentInPeriod),
    periodStart: serializeBn(tracker.periodStart),
    periodDuration: serializeBn(tracker.periodDuration),
  };
}

function deserializeTracker(
  tracker: SerializedLegacySpendTrackerData
): LegacySpendTrackerData {
  return {
    wallet: deserializePublicKey(tracker.wallet),
    spentInPeriod: deserializeBn(tracker.spentInPeriod),
    periodStart: deserializeBn(tracker.periodStart),
    periodDuration: deserializeBn(tracker.periodDuration),
  };
}

function serializeAssetTracker(
  tracker: AssetSpendTrackerData
): SerializedAssetSpendTrackerData {
  return {
    wallet: serializePublicKey(tracker.wallet),
    assetMint: serializePublicKey(tracker.assetMint),
    spentInPeriod: serializeBn(tracker.spentInPeriod),
    periodStart: serializeBn(tracker.periodStart),
    periodDuration: serializeBn(tracker.periodDuration),
  };
}

function deserializeAssetTracker(
  tracker: SerializedAssetSpendTrackerData
): AssetSpendTrackerData {
  return {
    wallet: deserializePublicKey(tracker.wallet),
    assetMint: deserializePublicKey(tracker.assetMint),
    spentInPeriod: deserializeBn(tracker.spentInPeriod),
    periodStart: deserializeBn(tracker.periodStart),
    periodDuration: deserializeBn(tracker.periodDuration),
  };
}

function serializeCounterpartyPolicy(
  policy: CounterpartyPolicyData
): SerializedCounterpartyPolicyData {
  return {
    wallet: serializePublicKey(policy.wallet),
    recipient: serializePublicKey(policy.recipient),
    enabled: policy.enabled,
    requireApproval: policy.requireApproval,
    maxPerTxOverride: policy.maxPerTxOverride
      ? serializeBn(policy.maxPerTxOverride)
      : null,
    dailyLimitOverride: policy.dailyLimitOverride
      ? serializeBn(policy.dailyLimitOverride)
      : null,
    allowedMints: policy.allowedMints.map(serializePublicKey),
  };
}

function deserializeCounterpartyPolicy(
  policy: SerializedCounterpartyPolicyData
): CounterpartyPolicyData {
  return {
    wallet: deserializePublicKey(policy.wallet),
    recipient: deserializePublicKey(policy.recipient),
    enabled: policy.enabled,
    requireApproval: policy.requireApproval,
    maxPerTxOverride: policy.maxPerTxOverride
      ? deserializeBn(policy.maxPerTxOverride)
      : null,
    dailyLimitOverride: policy.dailyLimitOverride
      ? deserializeBn(policy.dailyLimitOverride)
      : null,
    allowedMints: policy.allowedMints.map(deserializePublicKey),
  };
}

function serializeRequest(
  request: ExecutionRequestData
): SerializedExecutionRequestData {
  return {
    wallet: serializePublicKey(request.wallet),
    requestId: serializeBn(request.requestId),
    agent: serializePublicKey(request.agent),
    targetProgram: serializePublicKey(request.targetProgram),
    recipient: serializePublicKey(request.recipient),
    assetMint: serializePublicKey(request.assetMint),
    amount: serializeBn(request.amount),
    status: request.status,
    instructionHash: [...request.instructionHash],
    accountsHash: [...request.accountsHash],
    memo: request.memo,
    requestedAt: serializeBn(request.requestedAt),
    expiresAt: request.expiresAt ? serializeBn(request.expiresAt) : null,
    reviewedBy: request.reviewedBy
      ? serializePublicKey(request.reviewedBy)
      : null,
    reviewedAt: request.reviewedAt ? serializeBn(request.reviewedAt) : null,
  };
}

function deserializeRequest(
  request: SerializedExecutionRequestData
): ExecutionRequestData {
  return {
    wallet: deserializePublicKey(request.wallet),
    requestId: deserializeBn(request.requestId),
    agent: deserializePublicKey(request.agent),
    targetProgram: deserializePublicKey(request.targetProgram),
    recipient: deserializePublicKey(request.recipient),
    assetMint: deserializePublicKey(request.assetMint),
    amount: deserializeBn(request.amount),
    status: request.status,
    instructionHash: request.instructionHash,
    accountsHash: request.accountsHash,
    memo: request.memo,
    requestedAt: deserializeBn(request.requestedAt),
    expiresAt: request.expiresAt ? deserializeBn(request.expiresAt) : null,
    reviewedBy: request.reviewedBy
      ? deserializePublicKey(request.reviewedBy)
      : null,
    reviewedAt: request.reviewedAt ? deserializeBn(request.reviewedAt) : null,
  };
}

function serializeAuditEntry(entry: AuditEntryData): SerializedAuditEntryData {
  return {
    wallet: serializePublicKey(entry.wallet),
    requestId: serializeBn(entry.requestId),
    approved: entry.approved,
    outcome: entry.outcome,
    amount: serializeBn(entry.amount),
    assetMint: serializePublicKey(entry.assetMint),
    targetProgram: serializePublicKey(entry.targetProgram),
    recipient: serializePublicKey(entry.recipient),
    denialReason: entry.denialReason,
    memo: entry.memo,
    timestamp: serializeBn(entry.timestamp),
  };
}

function deserializeAuditEntry(
  entry: SerializedAuditEntryData
): AuditEntryData {
  return {
    wallet: deserializePublicKey(entry.wallet),
    requestId: deserializeBn(entry.requestId),
    approved: entry.approved,
    outcome: entry.outcome,
    amount: deserializeBn(entry.amount),
    assetMint: deserializePublicKey(entry.assetMint),
    targetProgram: deserializePublicKey(entry.targetProgram),
    recipient: deserializePublicKey(entry.recipient),
    denialReason: entry.denialReason,
    memo: entry.memo,
    timestamp: deserializeBn(entry.timestamp),
  };
}

export function serializeWalletSummary(
  wallet: WalletSummary
): SerializedWalletSummary {
  return {
    publicKey: serializePublicKey(wallet.publicKey),
    account: serializeSmartWalletAccount(wallet.account),
    balance: wallet.balance,
    policy: wallet.policy ? serializePolicy(wallet.policy) : null,
    tracker: wallet.tracker ? serializeTracker(wallet.tracker) : null,
    nativeAssetTracker: wallet.nativeAssetTracker
      ? serializeAssetTracker(wallet.nativeAssetTracker)
      : null,
  };
}

export function hydrateWalletSummary(
  wallet: SerializedWalletSummary
): WalletSummary {
  return {
    publicKey: deserializePublicKey(wallet.publicKey),
    account: deserializeSmartWalletAccount(wallet.account),
    balance: wallet.balance,
    policy: wallet.policy ? deserializePolicy(wallet.policy) : null,
    tracker: wallet.tracker ? deserializeTracker(wallet.tracker) : null,
    nativeAssetTracker: wallet.nativeAssetTracker
      ? deserializeAssetTracker(wallet.nativeAssetTracker)
      : null,
  };
}

export function serializeWalletDetail(
  detail: WalletDetail
): SerializedWalletDetail {
  return {
    walletAccount: detail.walletAccount
      ? serializeWalletSummary(detail.walletAccount)
      : null,
    policy: detail.policy ? serializePolicy(detail.policy) : null,
    tracker: detail.tracker ? serializeTracker(detail.tracker) : null,
    nativeAssetTracker: detail.nativeAssetTracker
      ? serializeAssetTracker(detail.nativeAssetTracker)
      : null,
    auditEntries: detail.auditEntries.map(serializeAuditEntry),
    requests: detail.requests.map(serializeRequest),
    pendingRequests: detail.pendingRequests.map(serializeRequest),
    auditCount: detail.auditCount,
    requestCount: detail.requestCount,
    hasMoreAuditEntries: detail.hasMoreAuditEntries,
    hasMoreRequests: detail.hasMoreRequests,
  };
}

export function hydrateWalletDetail(
  detail: SerializedWalletDetail
): WalletDetail {
  return {
    walletAccount: detail.walletAccount
      ? hydrateWalletSummary(detail.walletAccount)
      : null,
    policy: detail.policy ? deserializePolicy(detail.policy) : null,
    tracker: detail.tracker ? deserializeTracker(detail.tracker) : null,
    nativeAssetTracker: detail.nativeAssetTracker
      ? deserializeAssetTracker(detail.nativeAssetTracker)
      : null,
    auditEntries: detail.auditEntries.map(deserializeAuditEntry),
    requests: detail.requests.map(deserializeRequest),
    pendingRequests: detail.pendingRequests.map(deserializeRequest),
    auditCount: detail.auditCount,
    requestCount: detail.requestCount,
    hasMoreAuditEntries: detail.hasMoreAuditEntries,
    hasMoreRequests: detail.hasMoreRequests,
  };
}

export function serializePendingApproval(
  item: PendingApprovalItem
): SerializedPendingApprovalItem {
  return {
    wallet: serializePublicKey(item.wallet),
    owner: serializePublicKey(item.owner),
    agent: serializePublicKey(item.agent),
    request: serializeRequest(item.request),
  };
}

export function hydratePendingApproval(
  item: SerializedPendingApprovalItem
): PendingApprovalItem {
  return {
    wallet: deserializePublicKey(item.wallet),
    owner: deserializePublicKey(item.owner),
    agent: deserializePublicKey(item.agent),
    request: deserializeRequest(item.request),
  };
}

export function serializeCounterpartyPoliciesPage(
  page: QueryPage<CounterpartyPolicyData>
): SerializedQueryPage<SerializedCounterpartyPolicyData> {
  return {
    items: page.items.map(serializeCounterpartyPolicy),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function hydrateCounterpartyPoliciesPage(
  page: SerializedQueryPage<SerializedCounterpartyPolicyData>
): QueryPage<CounterpartyPolicyData> {
  return {
    items: page.items.map(deserializeCounterpartyPolicy),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function serializeWalletsPage(
  page: QueryPage<WalletSummary>
): SerializedQueryPage<SerializedWalletSummary> {
  return {
    items: page.items.map(serializeWalletSummary),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function hydrateWalletsPage(
  page: SerializedQueryPage<SerializedWalletSummary>
): QueryPage<WalletSummary> {
  return {
    items: page.items.map(hydrateWalletSummary),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function serializePendingApprovalsPage(
  page: QueryPage<PendingApprovalItem>
): SerializedQueryPage<SerializedPendingApprovalItem> {
  return {
    items: page.items.map(serializePendingApproval),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function hydratePendingApprovalsPage(
  page: SerializedQueryPage<SerializedPendingApprovalItem>
): QueryPage<PendingApprovalItem> {
  return {
    items: page.items.map(hydratePendingApproval),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function serializeRequestsPage(
  page: QueryPage<ExecutionRequestData>
): SerializedQueryPage<SerializedExecutionRequestData> {
  return {
    items: page.items.map(serializeRequest),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function hydrateRequestsPage(
  page: SerializedQueryPage<SerializedExecutionRequestData>
): QueryPage<ExecutionRequestData> {
  return {
    items: page.items.map(deserializeRequest),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function serializeAuditEntriesPage(
  page: QueryPage<AuditEntryData>
): SerializedQueryPage<SerializedAuditEntryData> {
  return {
    items: page.items.map(serializeAuditEntry),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}

export function hydrateAuditEntriesPage(
  page: SerializedQueryPage<SerializedAuditEntryData>
): QueryPage<AuditEntryData> {
  return {
    items: page.items.map(deserializeAuditEntry),
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    hasMore: page.hasMore,
  };
}
