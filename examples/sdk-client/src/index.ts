import { BN, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import idlJson from "../../../target/idl/tavsin.json";
import {
  buildNativeRequestPayload,
  createProgram,
  fetchAuditEntriesPage,
  fetchWalletDetail,
  getAssetTrackerPda,
  getAuditPda,
  getPolicyPda,
  getRequestPda,
  getWalletPda,
  NATIVE_MINT,
  PROGRAM_ID,
  type AnchorCompatibleWallet,
} from "@tavsin/sdk";

export function createExampleClient(args: {
  connection: Connection;
  wallet: AnchorCompatibleWallet;
  programId?: PublicKey;
}) {
  const program = createProgram(
    idlJson as Idl,
    args.connection,
    args.wallet,
    args.programId ?? PROGRAM_ID
  );

  async function createWalletForAgent(params: {
    agent: PublicKey;
    maxPerTxSol: number;
    maxDailySol: number;
    allowedPrograms?: PublicKey[];
    timeWindowStart?: number | null;
    timeWindowEnd?: number | null;
  }) {
    const [walletPda] = getWalletPda(args.wallet.publicKey, params.agent);
    const [policyPda] = getPolicyPda(walletPda);
    const [trackerPda] = getAssetTrackerPda(walletPda, NATIVE_MINT);

    await program.methods
      .createWallet(
        new BN(Math.floor(params.maxPerTxSol * LAMPORTS_PER_SOL)),
        new BN(Math.floor(params.maxDailySol * LAMPORTS_PER_SOL)),
        params.allowedPrograms ?? [],
        params.timeWindowStart ?? null,
        params.timeWindowEnd ?? null
      )
      .accounts({
        owner: args.wallet.publicKey,
        agent: params.agent,
        wallet: walletPda,
        policy: policyPda,
        tracker: trackerPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return walletPda;
  }

  async function submitNativeRequest(params: {
    walletPda: PublicKey;
    recipient: PublicKey;
    amountSol: number;
    memo?: string;
    expiresInMinutes?: number;
  }) {
    const walletAccount = await (program.account as any).smartWallet.fetch(
      params.walletPda
    );
    const [requestPda] = getRequestPda(
      params.walletPda,
      walletAccount.nextRequestId.toNumber()
    );
    const [auditEntryPda] = getAuditPda(
      params.walletPda,
      walletAccount.nextAuditId.toNumber()
    );
    const [assetTrackerPda] = getAssetTrackerPda(params.walletPda, NATIVE_MINT);
    const payload = buildNativeRequestPayload();
    const expiresAt = params.expiresInMinutes
      ? new BN(Math.floor(Date.now() / 1000) + params.expiresInMinutes * 60)
      : null;

    await program.methods
      .submitRequest(
        new BN(Math.floor(params.amountSol * LAMPORTS_PER_SOL)),
        params.memo ?? "SDK sample native request",
        payload.instructionHash,
        payload.accountsHash,
        expiresAt
      )
      .accounts({
        agent: args.wallet.publicKey,
        wallet: params.walletPda,
        policy: getPolicyPda(params.walletPda)[0],
        request: requestPda,
        auditEntry: auditEntryPda,
        recipient: params.recipient,
        assetMint: NATIVE_MINT,
        assetTracker: assetTrackerPda,
        targetProgram: payload.targetProgram,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return requestPda;
  }

  async function getWalletAudit(walletPda: PublicKey, limit = 25) {
    return fetchAuditEntriesPage(program, walletPda, 0, limit);
  }

  async function getWalletSnapshot(walletPda: PublicKey, limit = 25) {
    return fetchWalletDetail(program, args.connection, walletPda, limit);
  }

  return {
    program,
    createWalletForAgent,
    submitNativeRequest,
    getWalletAudit,
    getWalletSnapshot,
  };
}
