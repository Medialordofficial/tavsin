import {
  createTransferCheckedInstruction,
  getMint,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  type Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { createHash } from "crypto";

import {
  type WalletSignedAccountMeta,
  normalizeWalletSignedAccounts,
} from "./program";

export type PreparedRequestPayload = {
  targetProgram: PublicKey;
  instructionData: Buffer;
  remainingAccounts: WalletSignedAccountMeta[];
  instructionHash: number[];
  accountsHash: number[];
};

export type PreparedSplTransferCheckedPayload = PreparedRequestPayload & {
  assetMint: PublicKey;
  recipient: PublicKey;
};

export const SPL_TOKEN_PROGRAM_ID = TOKEN_PROGRAM_ID;

export function decimalAmountToBaseUnits(value: string, decimals: number): bigint {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Amount is required");
  }

  const isNegative = normalized.startsWith("-");
  if (isNegative) {
    throw new Error("Amount must be positive");
  }

  const [wholePart, fractionPart = ""] = normalized.split(".");
  if (!/^\d+$/.test(wholePart || "0") || !/^\d*$/.test(fractionPart)) {
    throw new Error("Amount must be numeric");
  }
  if (fractionPart.length > decimals) {
    throw new Error(`Amount supports at most ${decimals} decimal places`);
  }

  const paddedFraction = fractionPart.padEnd(decimals, "0");
  const baseUnits = `${wholePart || "0"}${paddedFraction}`.replace(/^0+(?=\d)/, "");
  return BigInt(baseUnits || "0");
}

export function getAssociatedTokenAccountForOwner(args: {
  allowOwnerOffCurve?: boolean;
  mint: PublicKey;
  owner: PublicKey;
  tokenProgramId?: PublicKey;
}) {
  return getAssociatedTokenAddressSync(
    args.mint,
    args.owner,
    args.allowOwnerOffCurve ?? false,
    args.tokenProgramId ?? TOKEN_PROGRAM_ID
  );
}

export function hashInstructionData(data: Uint8Array | Buffer): number[] {
  return [...createHash("sha256").update(Buffer.from(data)).digest()];
}

export function hashRemainingAccounts(accounts: WalletSignedAccountMeta[]): number[] {
  const encoded = Buffer.concat(
    accounts.map((account) =>
      Buffer.concat([
        account.pubkey.toBuffer(),
        Buffer.from([account.isWritable ? 1 : 0, account.isSigner ? 1 : 0]),
      ])
    )
  );

  return [...createHash("sha256").update(encoded).digest()];
}

export function buildRequestPayloadFromInstruction(
  instruction: TransactionInstruction,
  walletPda?: PublicKey
): PreparedRequestPayload {
  const remainingAccounts = walletPda
    ? normalizeWalletSignedAccounts(instruction.keys, walletPda)
    : instruction.keys.map((account) => ({
        pubkey: account.pubkey,
        isWritable: account.isWritable,
        isSigner: account.isSigner,
      }));
  const instructionData = Buffer.from(instruction.data);

  return {
    targetProgram: instruction.programId,
    instructionData,
    remainingAccounts,
    instructionHash: hashInstructionData(instructionData),
    accountsHash: hashRemainingAccounts(remainingAccounts),
  };
}

export function buildNativeRequestPayload(): PreparedRequestPayload {
  const instructionData = Buffer.alloc(0);
  const remainingAccounts: WalletSignedAccountMeta[] = [];

  return {
    targetProgram: SystemProgram.programId,
    instructionData,
    remainingAccounts,
    instructionHash: hashInstructionData(instructionData),
    accountsHash: hashRemainingAccounts(remainingAccounts),
  };
}

export function buildSplTransferCheckedPayload(args: {
  amount: number | bigint;
  decimals: number;
  destination: PublicKey;
  mint: PublicKey;
  source: PublicKey;
  tokenProgramId?: PublicKey;
  walletPda: PublicKey;
}): PreparedSplTransferCheckedPayload {
  const instruction = createTransferCheckedInstruction(
    args.source,
    args.mint,
    args.destination,
    args.walletPda,
    args.amount,
    args.decimals,
    [],
    args.tokenProgramId ?? TOKEN_PROGRAM_ID
  );
  const payload = buildRequestPayloadFromInstruction(instruction, args.walletPda);

  return {
    ...payload,
    assetMint: args.mint,
    recipient: args.destination,
  };
}

export async function buildSplTransferCheckedPayloadFromRequest(args: {
  connection: Connection;
  request: {
    amount: bigint | number | { toString(): string };
    assetMint: PublicKey;
    recipient: PublicKey;
  };
  source?: PublicKey;
  tokenProgramId?: PublicKey;
  walletPda: PublicKey;
}): Promise<PreparedSplTransferCheckedPayload> {
  const tokenProgramId = args.tokenProgramId ?? TOKEN_PROGRAM_ID;
  const mint = await getMint(args.connection, args.request.assetMint, "confirmed", tokenProgramId);
  const source =
    args.source ??
    getAssociatedTokenAccountForOwner({
      mint: args.request.assetMint,
      owner: args.walletPda,
      allowOwnerOffCurve: true,
      tokenProgramId,
    });
  const amount =
    typeof args.request.amount === "bigint" || typeof args.request.amount === "number"
      ? args.request.amount
      : BigInt(args.request.amount.toString());

  return buildSplTransferCheckedPayload({
    amount,
    decimals: mint.decimals,
    destination: args.request.recipient,
    mint: args.request.assetMint,
    source,
    tokenProgramId,
    walletPda: args.walletPda,
  });
}