import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";

export type WalletSignedAccountMeta = {
  pubkey: PublicKey;
  isWritable: boolean;
  isSigner: boolean;
};

export type AnchorCompatibleWallet = {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
};

export const PROGRAM_ID = new PublicKey(
  "2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy"
);

export const WALLET_SEED = Buffer.from("wallet");
export const POLICY_SEED = Buffer.from("policy");
export const TRACKER_SEED = Buffer.from("tracker");
export const AUDIT_SEED = Buffer.from("audit");
export const REQUEST_SEED = Buffer.from("request");
export const COUNTERPARTY_SEED = Buffer.from("counterparty");
export const NATIVE_MINT = PublicKey.default;

export function createProgram<T extends Idl>(
  idl: T,
  connection: Connection,
  wallet: AnchorCompatibleWallet,
  programId = PROGRAM_ID
) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const resolvedIdl = {
    ...(idl as object),
    address: programId.toBase58(),
  } as T;

  return new Program(resolvedIdl, provider);
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

export function getLegacyTrackerPda(walletPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [TRACKER_SEED, walletPda.toBuffer()],
    PROGRAM_ID
  );
}

export function getAssetTrackerPda(walletPda: PublicKey, assetMint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [TRACKER_SEED, walletPda.toBuffer(), assetMint.toBuffer()],
    PROGRAM_ID
  );
}

export function getAuditPda(walletPda: PublicKey, auditId: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(auditId));
  return PublicKey.findProgramAddressSync(
    [AUDIT_SEED, walletPda.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function getRequestPda(walletPda: PublicKey, requestId: number) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(requestId));
  return PublicKey.findProgramAddressSync(
    [REQUEST_SEED, walletPda.toBuffer(), buf],
    PROGRAM_ID
  );
}

export function getCounterpartyPolicyPda(walletPda: PublicKey, recipient: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [COUNTERPARTY_SEED, walletPda.toBuffer(), recipient.toBuffer()],
    PROGRAM_ID
  );
}

export function normalizeWalletSignedAccounts(
  accounts: WalletSignedAccountMeta[],
  walletPda: PublicKey
) {
  return accounts.map((account) =>
    account.pubkey.equals(walletPda)
      ? { ...account, isWritable: true, isSigner: false }
      : account
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
  6: "Blocked mint",
  7: "Recipient not allowed",
  8: "Approval required",
  9: "Rejected by owner",
  10: "Insufficient balance",
  11: "Request expired",
  12: "Unsupported execution",
};

export const REQUEST_STATUSES: Record<number, string> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
  3: "Executed",
  4: "Expired",
};