import type { BN } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";

export interface SmartWalletAccountData {
  version: number;
  owner: PublicKey;
  agent: PublicKey;
  frozen: boolean;
  bump: number;
  nextRequestId: BN;
  nextAuditId: BN;
  totalApproved: BN;
  totalDenied: BN;
  totalPending: BN;
  createdAt: BN;
}

export interface MintRuleData {
  mint: PublicKey;
  maxPerTx: BN;
  maxDaily: BN;
  requireApprovalAbove: BN | null;
}

export interface PolicyAccountData {
  version: number;
  wallet: PublicKey;
  maxPerTx: BN;
  maxDaily: BN;
  approvalThreshold: BN | null;
  requireApprovalForNewRecipients: boolean;
  allowedPrograms: PublicKey[];
  allowedRecipients: PublicKey[];
  blockedMints: PublicKey[];
  mintRules: MintRuleData[];
  timeWindowStart: BN | null;
  timeWindowEnd: BN | null;
}

export interface LegacySpendTrackerData {
  wallet: PublicKey;
  spentInPeriod: BN;
  periodStart: BN;
  periodDuration: BN;
}

export interface AssetSpendTrackerData {
  wallet: PublicKey;
  assetMint: PublicKey;
  spentInPeriod: BN;
  periodStart: BN;
  periodDuration: BN;
}

export interface CounterpartyPolicyData {
  wallet: PublicKey;
  recipient: PublicKey;
  enabled: boolean;
  requireApproval: boolean;
  maxPerTxOverride: BN | null;
  dailyLimitOverride: BN | null;
  allowedMints: PublicKey[];
}

export interface ExecutionRequestData {
  wallet: PublicKey;
  requestId: BN;
  agent: PublicKey;
  targetProgram: PublicKey;
  recipient: PublicKey;
  assetMint: PublicKey;
  amount: BN;
  status: number;
  instructionHash: number[];
  accountsHash: number[];
  memo: string;
  requestedAt: BN;
  expiresAt: BN | null;
  reviewedBy: PublicKey | null;
  reviewedAt: BN | null;
}

export interface AuditEntryData {
  wallet: PublicKey;
  requestId: BN;
  approved: boolean;
  outcome: number;
  amount: BN;
  assetMint: PublicKey;
  targetProgram: PublicKey;
  recipient: PublicKey;
  denialReason: number;
  memo: string;
  timestamp: BN;
}

export interface WalletSummary {
  publicKey: PublicKey;
  account: SmartWalletAccountData;
  balance: number;
  policy: PolicyAccountData | null;
  tracker: LegacySpendTrackerData | null;
  nativeAssetTracker: AssetSpendTrackerData | null;
}

export interface WalletDetail {
  walletAccount: WalletSummary | null;
  policy: PolicyAccountData | null;
  tracker: LegacySpendTrackerData | null;
  nativeAssetTracker: AssetSpendTrackerData | null;
  auditEntries: AuditEntryData[];
  requests: ExecutionRequestData[];
  pendingRequests: ExecutionRequestData[];
}