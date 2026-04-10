"use client";

import { use, useCallback, useMemo, useState } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import Link from "next/link";
import {
  buildNativeRequestPayload,
  buildSplTransferCheckedPayload,
  buildSplTransferCheckedPayloadFromRequest,
  decimalAmountToBaseUnits,
  DENIAL_REASONS,
  fetchCounterpartyPolicy,
  getAssetTrackerPda,
  getAssociatedTokenAccountForOwner,
  getAuditPda,
  getCounterpartyPolicyPda,
  getPolicyPda,
  getRequestPda,
  type MintRuleData,
  type PolicyAccountData,
  NATIVE_MINT,
  REQUEST_STATUSES,
  SPL_TOKEN_PROGRAM_ID,
  shortenAddress,
} from "@tavsin/sdk";
import { getProgram } from "@/lib/program";
import { useCounterpartyPolicies, useWalletDetail } from "@/hooks/useTavsin";
import { getErrorMessage } from "@/lib/errors";

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const {
    walletAccount,
    policy,
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
  } = useWalletDetail(address);
  const {
    policies: counterpartyPolicies,
    loading: counterpartyPoliciesLoading,
    refresh: refreshCounterpartyPolicies,
  } = useCounterpartyPolicies(address);

  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [requestRecipient, setRequestRecipient] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestMemo, setRequestMemo] = useState("");
  const [requestExpiryMinutes, setRequestExpiryMinutes] = useState("");
  const [splMint, setSplMint] = useState("");
  const [splRecipientOwner, setSplRecipientOwner] = useState("");
  const [splAmount, setSplAmount] = useState("");
  const [splDecimals, setSplDecimals] = useState("6");
  const [splMemo, setSplMemo] = useState("");
  const [splExpiryMinutes, setSplExpiryMinutes] = useState("");
  const [splSourceTokenAccount, setSplSourceTokenAccount] = useState("");
  const [splDestinationTokenAccount, setSplDestinationTokenAccount] = useState("");
  const [splExecutionSourceOverrides, setSplExecutionSourceOverrides] = useState<Record<string, string>>({});
  const [counterpartyRecipient, setCounterpartyRecipient] = useState("");
  const [counterpartySearch, setCounterpartySearch] = useState("");
  const [counterpartyEnabled, setCounterpartyEnabled] = useState(true);
  const [counterpartyRequireApproval, setCounterpartyRequireApproval] = useState(false);
  const [counterpartyMaxPerTx, setCounterpartyMaxPerTx] = useState("");
  const [counterpartyDailyLimit, setCounterpartyDailyLimit] = useState("");
  const [counterpartyAllowedMints, setCounterpartyAllowedMints] = useState("");
  const [counterpartyBusy, setCounterpartyBusy] = useState(false);
  const [counterpartyMessage, setCounterpartyMessage] = useState<string | null>(null);
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [txPending, setTxPending] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const walletPubkey = useMemo(() => new PublicKey(address), [address]);

  const clearMessages = () => {
    setTxError(null);
    setTxSuccess(null);
  };

  const handleFund = useCallback(async () => {
    if (!anchorWallet || !fundAmount || !walletAccount || !publicKey?.equals(walletAccount.account.owner)) {
      return;
    }

    clearMessages();
    setTxPending("Funding wallet...");

    try {
      const program = getProgram(connection, anchorWallet);
      const amount = new BN(Math.floor(parseFloat(fundAmount) * LAMPORTS_PER_SOL));

      await program.methods
        .fundWallet(amount)
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: walletPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSuccess(`Funded ${fundAmount} SOL`);
      setFundAmount("");
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Funding failed"));
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, fundAmount, publicKey, refresh, walletAccount, walletPubkey]);

  const handleWithdraw = useCallback(async () => {
    if (!anchorWallet || !withdrawAmount || !walletAccount || !publicKey?.equals(walletAccount.account.owner)) {
      return;
    }

    clearMessages();
    setTxPending("Withdrawing...");

    try {
      const program = getProgram(connection, anchorWallet);
      const amount = new BN(Math.floor(parseFloat(withdrawAmount) * LAMPORTS_PER_SOL));

      await program.methods
        .withdraw(amount)
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: walletPubkey,
        })
        .rpc();

      setTxSuccess(`Withdrew ${withdrawAmount} SOL`);
      setWithdrawAmount("");
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Withdrawal failed"));
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, publicKey, refresh, walletAccount, withdrawAmount, walletPubkey]);

  const handleFreeze = useCallback(async () => {
    if (!anchorWallet || !walletAccount || !publicKey?.equals(walletAccount.account.owner)) {
      return;
    }

    clearMessages();
    const isFrozen = Boolean(walletAccount?.account.frozen);
    setTxPending(isFrozen ? "Unfreezing wallet..." : "Freezing wallet...");

    try {
      const program = getProgram(connection, anchorWallet);

      if (isFrozen) {
        await program.methods
          .unfreezeWallet()
          .accounts({
            owner: anchorWallet.publicKey,
            wallet: walletPubkey,
          })
          .rpc();
        setTxSuccess("Wallet unfrozen");
      } else {
        await program.methods
          .freezeWallet()
          .accounts({
            owner: anchorWallet.publicKey,
            wallet: walletPubkey,
          })
          .rpc();
        setTxSuccess("Wallet frozen");
      }

      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Action failed"));
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, publicKey, refresh, walletAccount, walletPubkey]);

  const handleSubmitNativeRequest = useCallback(async () => {
    if (
      !anchorWallet ||
      !walletAccount ||
      !requestRecipient ||
      !requestAmount ||
      !publicKey?.equals(walletAccount.account.agent)
    ) {
      return;
    }

    clearMessages();
    setTxPending("Submitting native request...");

    try {
      const program = getProgram(connection, anchorWallet);
      const recipient = new PublicKey(requestRecipient.trim());
      const amount = new BN(Math.floor(parseFloat(requestAmount) * LAMPORTS_PER_SOL));
      const payload = buildNativeRequestPayload();
      const [requestPda] = getRequestPda(walletPubkey, walletAccount.account.nextRequestId.toNumber());
      const [auditEntryPda] = getAuditPda(walletPubkey, walletAccount.account.nextAuditId.toNumber());
      const [assetTrackerPda] = getAssetTrackerPda(walletPubkey, NATIVE_MINT);
      const expiresAt = requestExpiryMinutes
        ? new BN(Math.floor(Date.now() / 1000) + parseInt(requestExpiryMinutes, 10) * 60)
        : null;
      await program.methods
        .submitRequest(
          amount,
          requestMemo,
          payload.instructionHash,
          payload.accountsHash,
          expiresAt
        )
        .accounts({
          agent: anchorWallet.publicKey,
          wallet: walletPubkey,
          policy: getPolicyPda(walletPubkey)[0],
          request: requestPda,
          auditEntry: auditEntryPda,
          recipient,
          assetMint: NATIVE_MINT,
          assetTracker: assetTrackerPda,
          targetProgram: payload.targetProgram,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSuccess(`Submitted request for ${requestAmount} SOL`);
      setRequestRecipient("");
      setRequestAmount("");
      setRequestMemo("");
      setRequestExpiryMinutes("");
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Request submission failed"));
    } finally {
      setTxPending(null);
    }
  }, [
    anchorWallet,
    connection,
    publicKey,
    refresh,
    requestAmount,
    requestExpiryMinutes,
    requestMemo,
    requestRecipient,
    walletAccount,
    walletPubkey,
  ]);

  const handleSubmitSplRequest = useCallback(async () => {
    if (
      !anchorWallet ||
      !walletAccount ||
      !splMint ||
      !splRecipientOwner ||
      !splAmount ||
      !publicKey?.equals(walletAccount.account.agent)
    ) {
      return;
    }

    clearMessages();
    setTxPending("Submitting SPL request...");

    try {
      const program = getProgram(connection, anchorWallet);
      const mint = new PublicKey(splMint.trim());
      const recipientOwner = new PublicKey(splRecipientOwner.trim());
      const decimals = parseInt(splDecimals, 10);
      const rawAmount = decimalAmountToBaseUnits(splAmount, decimals);
      const sourceTokenAccount = splSourceTokenAccount
        ? new PublicKey(splSourceTokenAccount.trim())
        : getAssociatedTokenAccountForOwner({
            mint,
            owner: walletPubkey,
            allowOwnerOffCurve: true,
          });
      const destinationTokenAccount = splDestinationTokenAccount
        ? new PublicKey(splDestinationTokenAccount.trim())
        : getAssociatedTokenAccountForOwner({
            mint,
            owner: recipientOwner,
          });
      const payload = buildSplTransferCheckedPayload({
        amount: rawAmount,
        decimals,
        destination: destinationTokenAccount,
        mint,
        source: sourceTokenAccount,
        walletPda: walletPubkey,
      });
      const [requestPda] = getRequestPda(walletPubkey, walletAccount.account.nextRequestId.toNumber());
      const [auditEntryPda] = getAuditPda(walletPubkey, walletAccount.account.nextAuditId.toNumber());
      const [assetTrackerPda] = getAssetTrackerPda(walletPubkey, mint);
      const expiresAt = splExpiryMinutes
        ? new BN(Math.floor(Date.now() / 1000) + parseInt(splExpiryMinutes, 10) * 60)
        : null;

      await program.methods
        .submitRequest(
          new BN(rawAmount.toString()),
          splMemo,
          payload.instructionHash,
          payload.accountsHash,
          expiresAt
        )
        .accounts({
          agent: anchorWallet.publicKey,
          wallet: walletPubkey,
          policy: getPolicyPda(walletPubkey)[0],
          request: requestPda,
          auditEntry: auditEntryPda,
          recipient: payload.recipient,
          assetMint: payload.assetMint,
          assetTracker: assetTrackerPda,
          targetProgram: payload.targetProgram,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(payload.remainingAccounts)
        .rpc();

      setTxSuccess(`Submitted SPL request for ${splAmount} tokens`);
      setSplMint("");
      setSplRecipientOwner("");
      setSplAmount("");
      setSplDecimals("6");
      setSplMemo("");
      setSplExpiryMinutes("");
      setSplSourceTokenAccount("");
      setSplDestinationTokenAccount("");
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "SPL request submission failed"));
    } finally {
      setTxPending(null);
    }
  }, [
    anchorWallet,
    connection,
    publicKey,
    refresh,
    splAmount,
    splDecimals,
    splDestinationTokenAccount,
    splExpiryMinutes,
    splMemo,
    splMint,
    splRecipientOwner,
    splSourceTokenAccount,
    walletAccount,
    walletPubkey,
  ]);

  const handleApproveRequest = useCallback(async (requestId: number) => {
    if (!anchorWallet || !walletAccount || !publicKey?.equals(walletAccount.account.owner)) {
      return;
    }

    clearMessages();
    setTxPending(`Approving request #${requestId}...`);

    try {
      const program = getProgram(connection, anchorWallet);
      const [requestPda] = getRequestPda(walletPubkey, requestId);
      const [auditEntryPda] = getAuditPda(walletPubkey, walletAccount.account.nextAuditId.toNumber());

      await program.methods
        .approveRequest()
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: walletPubkey,
          request: requestPda,
          auditEntry: auditEntryPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSuccess(`Approved request #${requestId}`);
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Approve request failed"));
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, publicKey, refresh, walletAccount, walletPubkey]);

  const handleRejectRequest = useCallback(async (requestId: number) => {
    if (!anchorWallet || !walletAccount || !publicKey?.equals(walletAccount.account.owner)) {
      return;
    }

    clearMessages();
    setTxPending(`Rejecting request #${requestId}...`);

    try {
      const program = getProgram(connection, anchorWallet);
      const [requestPda] = getRequestPda(walletPubkey, requestId);
      const [auditEntryPda] = getAuditPda(walletPubkey, walletAccount.account.nextAuditId.toNumber());

      await program.methods
        .rejectRequest()
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: walletPubkey,
          request: requestPda,
          auditEntry: auditEntryPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSuccess(`Rejected request #${requestId}`);
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Reject request failed"));
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, publicKey, refresh, walletAccount, walletPubkey]);

  const handleExecuteNativeRequest = useCallback(async (requestId: number) => {
    if (!anchorWallet || !walletAccount || !publicKey?.equals(walletAccount.account.agent)) {
      return;
    }

    clearMessages();
    setTxPending(`Executing request #${requestId}...`);

    try {
      const request = requests.find((item) => item.requestId.toNumber() === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      const program = getProgram(connection, anchorWallet);
      const [requestPda] = getRequestPda(walletPubkey, requestId);
      const [auditEntryPda] = getAuditPda(walletPubkey, walletAccount.account.nextAuditId.toNumber());
      const [assetTrackerPda] = getAssetTrackerPda(walletPubkey, request.assetMint);

      await program.methods
        .executeRequest()
        .accounts({
          agent: anchorWallet.publicKey,
          wallet: walletPubkey,
          policy: getPolicyPda(walletPubkey)[0],
          request: requestPda,
          assetTracker: assetTrackerPda,
          auditEntry: auditEntryPda,
          targetProgram: request.targetProgram,
          recipient: request.recipient,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSuccess(`Executed request #${requestId}`);
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Execute request failed"));
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, publicKey, refresh, requests, walletAccount, walletPubkey]);

  const handleExecuteSplRequest = useCallback(async (requestId: number) => {
    if (!anchorWallet || !walletAccount || !publicKey?.equals(walletAccount.account.agent)) {
      return;
    }

    clearMessages();
    setTxPending(`Executing SPL request #${requestId}...`);

    try {
      const request = requests.find((item) => item.requestId.toNumber() === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      const overrideValue = splExecutionSourceOverrides[requestId.toString()]?.trim();
      const payload = await buildSplTransferCheckedPayloadFromRequest({
        connection,
        request,
        source: overrideValue ? new PublicKey(overrideValue) : undefined,
        walletPda: walletPubkey,
      });
      const program = getProgram(connection, anchorWallet);
      const [requestPda] = getRequestPda(walletPubkey, requestId);
      const [auditEntryPda] = getAuditPda(walletPubkey, walletAccount.account.nextAuditId.toNumber());
      const [assetTrackerPda] = getAssetTrackerPda(walletPubkey, request.assetMint);

      await program.methods
        .executeRequestWithPayload(Buffer.from(payload.instructionData))
        .accounts({
          agent: anchorWallet.publicKey,
          wallet: walletPubkey,
          policy: getPolicyPda(walletPubkey)[0],
          request: requestPda,
          assetTracker: assetTrackerPda,
          auditEntry: auditEntryPda,
          targetProgram: request.targetProgram,
          recipient: request.recipient,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(payload.remainingAccounts)
        .rpc();

      setTxSuccess(`Executed SPL request #${requestId}`);
      setSplExecutionSourceOverrides((current) => {
        const next = { ...current };
        delete next[requestId.toString()];
        return next;
      });
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Execute SPL request failed"));
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, publicKey, refresh, requests, splExecutionSourceOverrides, walletAccount, walletPubkey]);

  const populateCounterpartyForm = useCallback((recipientValue: string, policyAccount: Awaited<ReturnType<typeof fetchCounterpartyPolicy>>) => {
    setCounterpartyRecipient(recipientValue);

    if (!policyAccount) {
      setCounterpartyEnabled(true);
      setCounterpartyRequireApproval(false);
      setCounterpartyMaxPerTx("");
      setCounterpartyDailyLimit("");
      setCounterpartyAllowedMints("");
      return;
    }

    setCounterpartyEnabled(policyAccount.enabled);
    setCounterpartyRequireApproval(policyAccount.requireApproval);
    setCounterpartyMaxPerTx(
      policyAccount.maxPerTxOverride
        ? (policyAccount.maxPerTxOverride.toNumber() / LAMPORTS_PER_SOL).toString()
        : ""
    );
    setCounterpartyDailyLimit(
      policyAccount.dailyLimitOverride
        ? (policyAccount.dailyLimitOverride.toNumber() / LAMPORTS_PER_SOL).toString()
        : ""
    );
    setCounterpartyAllowedMints(
      policyAccount.allowedMints.map((mint) => mint.toBase58()).join("\n")
    );
  }, []);

  const handleLoadCounterpartyPolicy = useCallback(async () => {
    if (!anchorWallet || !counterpartyRecipient) {
      return;
    }

    setCounterpartyBusy(true);
    setCounterpartyMessage(null);

    try {
      const program = getProgram(connection, anchorWallet);
      const recipient = new PublicKey(counterpartyRecipient.trim());
      const policyAccount = await fetchCounterpartyPolicy(program, walletPubkey, recipient);

      if (!policyAccount) {
        populateCounterpartyForm(recipient.toBase58(), null);
        setCounterpartyMessage("No existing override found. Saving will create a new counterparty policy.");
        return;
      }

      populateCounterpartyForm(recipient.toBase58(), policyAccount);
      setCounterpartyMessage("Loaded existing counterparty override.");
    } catch (err: unknown) {
      setCounterpartyMessage(getErrorMessage(err, "Unable to load counterparty policy"));
    } finally {
      setCounterpartyBusy(false);
    }
  }, [anchorWallet, connection, counterpartyRecipient, populateCounterpartyForm, walletPubkey]);

  const handleSaveCounterpartyPolicy = useCallback(async () => {
    if (!anchorWallet || !walletAccount || !counterpartyRecipient || !publicKey?.equals(walletAccount.account.owner)) {
      return;
    }

    clearMessages();
    setCounterpartyBusy(true);
    setCounterpartyMessage(null);
    setTxPending("Saving counterparty policy...");

    try {
      const program = getProgram(connection, anchorWallet);
      const recipient = new PublicKey(counterpartyRecipient.trim());
      const [counterpartyPolicyPda] = getCounterpartyPolicyPda(walletPubkey, recipient);
      const allowedMints = counterpartyAllowedMints
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => new PublicKey(value));

      await program.methods
        .upsertCounterpartyPolicy(
          counterpartyEnabled,
          counterpartyRequireApproval,
          counterpartyMaxPerTx ? new BN(Math.floor(parseFloat(counterpartyMaxPerTx) * LAMPORTS_PER_SOL)) : null,
          counterpartyDailyLimit ? new BN(Math.floor(parseFloat(counterpartyDailyLimit) * LAMPORTS_PER_SOL)) : null,
          allowedMints
        )
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: walletPubkey,
          recipient,
          counterpartyPolicy: counterpartyPolicyPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxSuccess(`Saved counterparty policy for ${shortenAddress(recipient.toBase58(), 6)}`);
      setCounterpartyMessage("Counterparty override saved.");
      refresh();
      refreshCounterpartyPolicies();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Counterparty policy update failed"));
    } finally {
      setCounterpartyBusy(false);
      setTxPending(null);
    }
  }, [
    anchorWallet,
    connection,
    counterpartyAllowedMints,
    counterpartyDailyLimit,
    counterpartyEnabled,
    counterpartyMaxPerTx,
    counterpartyRecipient,
    counterpartyRequireApproval,
    publicKey,
    refresh,
    refreshCounterpartyPolicies,
    walletAccount,
    walletPubkey,
  ]);

  if (!connected) {
    return (
      <div className="relative min-h-[80vh] overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(245,158,11,0.12),transparent_18%)]" />
          <div className="absolute left-0 right-0 top-20 h-[420px] tavsin-grid-mask" />
        </div>
        <div className="relative flex min-h-[80vh] items-center justify-center">
          <div className="tavsin-fade-up rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(8,12,24,0.98))] px-8 py-10 text-center shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Access Required
            </div>
            <h1 className="mb-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Connect your wallet to continue
            </h1>
            <p className="max-w-md leading-7 text-slate-300">
              The wallet console requires an active Solana wallet connection so you can view balances, manage policy state, and control funding.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <span className="ml-3 text-slate-300">Loading wallet state...</span>
      </div>
    );
  }

  if (error || !walletAccount) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 px-8 py-10 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-red-300">
            Wallet Lookup Failed
          </div>
          <p className="mb-5 text-red-100">{error || "Wallet not found"}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-slate-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { account, balance } = walletAccount;
  const isOwner = Boolean(publicKey?.equals(account.owner));
  const isAgent = Boolean(publicKey?.equals(account.agent));
  const totalTx = account.totalApproved.toNumber() + account.totalDenied.toNumber();
  const approvalRate = totalTx > 0 ? Math.round((account.totalApproved.toNumber() / totalTx) * 100) : 100;
  const statusLabel = account.frozen ? "Frozen" : "Active";
  const statusTone = account.frozen
    ? "border-red-500/20 bg-red-500/10 text-red-300"
    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  const createdAt = new Date(account.createdAt.toNumber() * 1000).toLocaleString();
  const approvedNativeRequests = requests.filter(
    (request) =>
      request.status === 1 &&
      request.assetMint.equals(NATIVE_MINT) &&
      request.targetProgram.equals(SystemProgram.programId)
  );
  const approvedSplRequests = requests.filter(
    (request) =>
      request.status === 1 &&
      !request.assetMint.equals(NATIVE_MINT) &&
      request.targetProgram.equals(SPL_TOKEN_PROGRAM_ID)
  );
  const rejectedRequests = requests.filter((request) => request.status === 2);
  const executedRequests = requests.filter((request) => request.status === 3);
  const expiredRequests = requests.filter((request) => request.status === 4);
  const normalizedCounterpartySearch = counterpartySearch.trim().toLowerCase();
  const filteredCounterpartyPolicies = counterpartyPolicies.filter((policyAccount) => {
    if (!normalizedCounterpartySearch) {
      return true;
    }

    return (
      policyAccount.recipient.toBase58().toLowerCase().includes(normalizedCounterpartySearch) ||
      policyAccount.allowedMints.some((mint) =>
        mint.toBase58().toLowerCase().includes(normalizedCounterpartySearch)
      )
    );
  });

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_18%),radial-gradient(circle_at_90%_10%,rgba(245,158,11,0.08),transparent_16%)]" />
        <div className="absolute left-0 right-0 top-16 h-[380px] tavsin-grid-mask" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-cyan-200"
          >
            ← Back to Dashboard
          </Link>
          {isOwner ? (
            <button
              onClick={handleFreeze}
              disabled={!!txPending}
              className={`rounded-2xl border px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-all disabled:opacity-50 ${
                account.frozen
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                  : "border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/15"
              }`}
            >
              {account.frozen ? "Unfreeze Wallet" : "Freeze Wallet"}
            </button>
          ) : (
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              {isAgent ? "Connected As Agent" : "View Only"}
            </div>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="tavsin-fade-up rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.42)]">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-6">
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  Wallet Console
                </div>
                <h1 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
                  {shortenAddress(address, 10)}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  This account stores agent capital inside the TavSin PDA wallet. Policy checks, freeze controls, and audit records are enforced on-chain.
                </p>
              </div>

              <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusTone}`}>
                {statusLabel}
              </div>
            </div>

            {txPending && (
              <div className="mb-5 flex items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                <div className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                {txPending}
              </div>
            )}
            {txSuccess && (
              <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {txSuccess}
              </div>
            )}
            {txError && (
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {txError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Balance" value={`${balance.toFixed(4)} SOL`} tone="cyan" />
              <Metric label="Total Tx" value={totalTx.toString()} tone="slate" />
              <Metric label="Approved" value={account.totalApproved.toString()} tone="emerald" />
              <Metric label="Denied" value={account.totalDenied.toString()} tone="red" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoPanel label="Owner" value={shortenAddress(account.owner.toBase58(), 8)} />
              <InfoPanel label="Agent" value={shortenAddress(account.agent.toBase58(), 8)} />
              <InfoPanel label="Created" value={createdAt} />
              <InfoPanel label="Approval Rate" value={`${approvalRate}%`} />
              <InfoPanel label="Pending Requests" value={account.totalPending.toString()} />
              <InfoPanel label="Session Role" value={isOwner ? "Owner" : isAgent ? "Agent" : "Observer"} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ActionCard
                title="Fund Wallet"
                desc="Deposit SOL into the PDA wallet that the agent can spend within policy limits."
              >
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="SOL amount"
                    className="flex-1 rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={handleFund}
                    disabled={!!txPending || !fundAmount || !isOwner}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Fund
                  </button>
                </div>
              </ActionCard>

              <ActionCard
                title="Withdraw"
                desc="Return unused capital to the owner wallet when you rebalance or shut down an agent."
              >
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="SOL amount"
                    className="flex-1 rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={!!txPending || !withdrawAmount || !isOwner}
                    className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-amber-200 transition-colors hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                </div>
              </ActionCard>

              <ActionCard
                title="Submit Native Request"
                desc="Connect as the agent to propose a governed SOL transfer. The owner can approve or reject it below when policy requires review."
              >
                <div className="space-y-3">
                  <input
                    type="text"
                    value={requestRecipient}
                    onChange={(e) => setRequestRecipient(e.target.value)}
                    placeholder="Recipient public key"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="SOL amount"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="1"
                      value={requestExpiryMinutes}
                      onChange={(e) => setRequestExpiryMinutes(e.target.value)}
                      placeholder="Expiry minutes (optional)"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <textarea
                    value={requestMemo}
                    onChange={(e) => setRequestMemo(e.target.value)}
                    rows={2}
                    placeholder="Why this payment is needed"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSubmitNativeRequest}
                    disabled={!!txPending || !requestRecipient || !requestAmount || !isAgent}
                    className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Request
                  </button>
                </div>
              </ActionCard>

              <ActionCard
                title="Submit SPL Request"
                desc="Compose a governed SPL Token Program transfer. Default token accounts are derived from the wallet PDA and recipient owner when omitted."
              >
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={splMint}
                      onChange={(e) => setSplMint(e.target.value)}
                      placeholder="Mint address"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={splRecipientOwner}
                      onChange={(e) => setSplRecipientOwner(e.target.value)}
                      placeholder="Recipient owner public key"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      type="text"
                      value={splAmount}
                      onChange={(e) => setSplAmount(e.target.value)}
                      placeholder="Token amount"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      value={splDecimals}
                      onChange={(e) => setSplDecimals(e.target.value)}
                      placeholder="Decimals"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="1"
                      value={splExpiryMinutes}
                      onChange={(e) => setSplExpiryMinutes(e.target.value)}
                      placeholder="Expiry minutes"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={splSourceTokenAccount}
                    onChange={(e) => setSplSourceTokenAccount(e.target.value)}
                    placeholder="Source token account override (optional)"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={splDestinationTokenAccount}
                    onChange={(e) => setSplDestinationTokenAccount(e.target.value)}
                    placeholder="Destination token account override (optional)"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <textarea
                    value={splMemo}
                    onChange={(e) => setSplMemo(e.target.value)}
                    rows={2}
                    placeholder="Why this token transfer is needed"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSubmitSplRequest}
                    disabled={!!txPending || !splMint || !splRecipientOwner || !splAmount || !isAgent}
                    className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit SPL Request
                  </button>
                </div>
              </ActionCard>
            </div>
          </section>

          <aside className="tavsin-fade-up tavsin-delay-1 space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Policy Envelope
              </div>
              {policy ? (
                <>
                  <div className="space-y-4">
                    <MiniRow label="Max / Tx" value={`${(policy.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`} />
                    <MiniRow label="Daily Budget" value={`${(policy.maxDaily.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`} />
                    <MiniRow
                      label="Allowed Programs"
                      value={policy.allowedPrograms.length === 0 ? "All programs" : `${policy.allowedPrograms.length} allowlisted`}
                    />
                    <MiniRow
                      label="Allowed Recipients"
                      value={policy.allowedRecipients.length === 0 ? "Open set" : `${policy.allowedRecipients.length} allowlisted`}
                    />
                    <MiniRow
                      label="Blocked Mints"
                      value={policy.blockedMints.length === 0 ? "None" : `${policy.blockedMints.length} blocked`}
                    />
                    <MiniRow
                      label="Approval Threshold"
                      value={policy.approvalThreshold ? `${(policy.approvalThreshold.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL` : "Disabled"}
                    />
                    <MiniRow
                      label="Mint Rules"
                      value={policy.mintRules.length === 0 ? "No asset-specific overrides" : `${policy.mintRules.length} asset rules`}
                    />
                    <MiniRow
                      label="Time Window"
                      value={
                        policy.timeWindowStart && policy.timeWindowEnd
                          ? `${Math.floor(policy.timeWindowStart.toNumber() / 3600)}:00 - ${Math.floor(policy.timeWindowEnd.toNumber() / 3600)}:00 UTC`
                          : "24/7"
                      }
                    />
                  </div>

                  {policy.mintRules.length > 0 && (
                    <div className="mt-5 space-y-3 rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        Asset Rule Overrides
                      </div>
                      {policy.mintRules.map((rule) => (
                        <div key={rule.mint.toBase58()} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                          <div className="font-mono text-xs text-white">{shortenAddress(rule.mint.toBase58(), 6)}</div>
                          <div className="mt-2 grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
                            <div>Max / tx {(rule.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL</div>
                            <div>Daily {(rule.maxDaily.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL</div>
                            <div>
                              Approval {rule.requireApprovalAbove ? `${(rule.requireApprovalAbove.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL` : "Disabled"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm leading-7 text-slate-300">Policy account not found for this wallet.</p>
              )}

              {nativeAssetTracker && policy && (
                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Spent in period</span>
                    <span className="font-semibold text-white">
                      {(nativeAssetTracker.spentInPeriod.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-300"
                      style={{
                        width: `${Math.min(100, (nativeAssetTracker.spentInPeriod.toNumber() / Math.max(policy.maxDaily.toNumber(), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {isOwner && (
                <>
                  <button
                    onClick={() => setShowPolicyEditor((value) => !value)}
                    className="mt-5 inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/6"
                  >
                    {showPolicyEditor ? "Close Policy Editor" : "Edit Policy"}
                  </button>

                  {showPolicyEditor && (
                    <div className="mt-5">
                      <PolicyEditor
                        address={address}
                        currentPolicy={policy}
                        onDone={() => {
                          setShowPolicyEditor(false);
                          refresh();
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </section>

            {isOwner && (
              <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-200">
                  Counterparty Override
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={counterpartySearch}
                    onChange={(e) => setCounterpartySearch(e.target.value)}
                    placeholder="Search saved recipients or allowed mints"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-3">
                    <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      <span>Saved Overrides</span>
                      <span>{counterpartyPolicies.length}</span>
                    </div>
                    {counterpartyPoliciesLoading ? (
                      <div className="text-sm text-slate-300">Loading counterparty policies...</div>
                    ) : filteredCounterpartyPolicies.length === 0 ? (
                      <div className="text-sm text-slate-300">No saved overrides match the current search.</div>
                    ) : (
                      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                        {filteredCounterpartyPolicies.map((policyAccount) => (
                          <button
                            key={policyAccount.recipient.toBase58()}
                            type="button"
                            onClick={() => {
                              populateCounterpartyForm(policyAccount.recipient.toBase58(), policyAccount);
                              setCounterpartyMessage("Loaded existing counterparty override.");
                            }}
                            className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-colors hover:bg-white/[0.06]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono text-xs text-white">
                                {shortenAddress(policyAccount.recipient.toBase58(), 6)}
                              </span>
                              <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${policyAccount.requireApproval ? "border-amber-300/20 bg-amber-300/10 text-amber-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
                                {policyAccount.requireApproval ? "Approval" : "Auto"}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                              <span>{policyAccount.enabled ? "Enabled" : "Disabled"}</span>
                              <span>•</span>
                              <span>{policyAccount.allowedMints.length === 0 ? "All mints" : `${policyAccount.allowedMints.length} mint overrides`}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={counterpartyRecipient}
                    onChange={(e) => setCounterpartyRecipient(e.target.value)}
                    placeholder="Recipient public key"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleLoadCounterpartyPolicy}
                      disabled={counterpartyBusy || !counterpartyRecipient}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
                    >
                      Load Existing
                    </button>
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={counterpartyEnabled}
                      onChange={(event) => setCounterpartyEnabled(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-black/20 text-cyan-400"
                    />
                    Override enabled
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={counterpartyRequireApproval}
                      onChange={(event) => setCounterpartyRequireApproval(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-black/20 text-cyan-400"
                    />
                    Require approval for this recipient
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={counterpartyMaxPerTx}
                      onChange={(e) => setCounterpartyMaxPerTx(e.target.value)}
                      placeholder="Max per tx override (SOL)"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={counterpartyDailyLimit}
                      onChange={(e) => setCounterpartyDailyLimit(e.target.value)}
                      placeholder="Daily limit override (SOL)"
                      className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <textarea
                    value={counterpartyAllowedMints}
                    onChange={(e) => setCounterpartyAllowedMints(e.target.value)}
                    rows={3}
                    placeholder="Allowed mints for this recipient, one per line"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  {counterpartyMessage && (
                    <div className="rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-slate-200">
                      {counterpartyMessage}
                    </div>
                  )}
                  <button
                    onClick={handleSaveCounterpartyPolicy}
                    disabled={counterpartyBusy || !!txPending || !counterpartyRecipient}
                    className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-300/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-100 transition-colors hover:bg-fuchsia-300/15 disabled:opacity-50"
                  >
                    Save Counterparty Policy
                  </button>
                </div>
              </section>
            )}

            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Audit Summary
              </div>
              <div className="grid gap-3">
                <MiniRow label="Approved" value={account.totalApproved.toString()} />
                <MiniRow label="Denied" value={account.totalDenied.toString()} />
                <MiniRow label="Pending" value={account.totalPending.toString()} />
                <MiniRow label="Decisions" value={totalTx.toString()} />
                <MiniRow label="Memo Log" value={auditEntries.length > 0 ? `${auditEntries.length} entries` : "Empty"} />
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Pending Queue
              </div>
              {pendingRequests.length === 0 ? (
                <p className="text-sm leading-7 text-slate-300">No requests waiting on owner approval.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 5).map((request) => (
                    <div key={request.requestId.toString()} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-white">
                          {(request.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} {request.assetMint.equals(NATIVE_MINT) ? "SOL" : "asset"}
                        </span>
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                          {REQUEST_STATUSES[request.status] || `Status ${request.status}`}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-300">{request.memo || "No memo"}</div>
                      <div className="mt-2 text-xs font-mono text-slate-400">
                        {shortenAddress(request.recipient.toBase58(), 6)}
                      </div>
                      {isOwner && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.requestId.toNumber())}
                            disabled={!!txPending}
                            className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 transition-colors hover:bg-emerald-400/15 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.requestId.toNumber())}
                            disabled={!!txPending}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Ready To Execute
              </div>
              {approvedNativeRequests.length === 0 ? (
                <p className="text-sm leading-7 text-slate-300">No approved native requests are waiting for agent execution.</p>
              ) : (
                <div className="space-y-3">
                  {approvedNativeRequests.slice(0, 5).map((request) => (
                    <div key={request.requestId.toString()} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-white">
                          {(request.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </span>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                          Approved
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-300">{request.memo || "No memo"}</div>
                      <div className="mt-2 text-xs font-mono text-slate-400">
                        {shortenAddress(request.recipient.toBase58(), 6)}
                      </div>
                      {isAgent && (
                        <button
                          onClick={() => handleExecuteNativeRequest(request.requestId.toNumber())}
                          disabled={!!txPending}
                          className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:opacity-50"
                        >
                          Execute
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Ready To Execute: SPL
              </div>
              {approvedSplRequests.length === 0 ? (
                <p className="text-sm leading-7 text-slate-300">No approved SPL requests are waiting for agent execution.</p>
              ) : (
                <div className="space-y-3">
                  {approvedSplRequests.slice(0, 5).map((request) => {
                    const requestId = request.requestId.toString();

                    return (
                      <div key={requestId} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-white">{request.amount.toString()} base units</span>
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                            Approved
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-300">{request.memo || "No memo"}</div>
                        <div className="mt-2 space-y-1 text-xs font-mono text-slate-400">
                          <div>Mint {shortenAddress(request.assetMint.toBase58(), 6)}</div>
                          <div>Destination {shortenAddress(request.recipient.toBase58(), 6)}</div>
                        </div>
                        {isAgent && (
                          <div className="mt-3 space-y-3">
                            <input
                              type="text"
                              value={splExecutionSourceOverrides[requestId] || ""}
                              onChange={(event) =>
                                setSplExecutionSourceOverrides((current) => ({
                                  ...current,
                                  [requestId]: event.target.value,
                                }))
                              }
                              placeholder="Source token account override (optional)"
                              className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                            />
                            <button
                              onClick={() => handleExecuteSplRequest(request.requestId.toNumber())}
                              disabled={!!txPending}
                              className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:opacity-50"
                            >
                              Execute SPL Transfer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Request Lifecycle
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <MiniRow label="Executed" value={executedRequests.length.toString()} />
                <MiniRow label="Rejected" value={rejectedRequests.length.toString()} />
                <MiniRow label="Expired" value={expiredRequests.length.toString()} />
              </div>
              <div className="mb-4 text-sm text-slate-300">Loaded {requests.length} of {requestCount} requests</div>
              {requests.filter((request) => request.status !== 0).length === 0 ? (
                <p className="text-sm leading-7 text-slate-300">No completed lifecycle events yet beyond pending review.</p>
              ) : (
                <div className="space-y-3">
                  {requests
                    .filter((request) => request.status !== 0)
                    .slice(0, 6)
                    .map((request) => (
                      <div key={request.requestId.toString()} className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-white">
                            {(request.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} {request.assetMint.equals(NATIVE_MINT) ? "SOL" : "asset"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                            {REQUEST_STATUSES[request.status] || `Status ${request.status}`}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-300">{request.memo || "No memo"}</div>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-mono text-slate-400">
                          <span>{shortenAddress(request.recipient.toBase58(), 6)}</span>
                          {request.reviewedAt && <span>{new Date(request.reviewedAt.toNumber() * 1000).toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {hasMoreRequests && (
                <button
                  onClick={loadMoreRequests}
                  disabled={loadingMoreRequests}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8 disabled:opacity-50"
                >
                  {loadingMoreRequests ? "Loading requests..." : "Load More Requests"}
                </button>
              )}
            </section>
          </aside>
        </div>

        <section className="tavsin-fade-up tavsin-delay-2 mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Audit Trail
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                Protocol decisions, recorded transparently
              </h2>
            </div>
            <div className="text-sm text-slate-300">
              {auditEntries.length} of {auditCount} entries
            </div>
          </div>

          {auditEntries.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-8 text-sm leading-7 text-slate-300">
              No decisions recorded yet. Once the agent starts spending, each approval and denial will appear here as an on-chain audit record.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[1.5rem] border border-white/8 bg-black/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-left text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Amount</th>
                    <th className="px-4 py-4">Target</th>
                    <th className="px-4 py-4">Reason</th>
                    <th className="px-4 py-4">Memo</th>
                    <th className="px-4 py-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((entry, index) => (
                    <tr key={`${entry.timestamp.toString()}-${index}`} className="border-b border-white/6 hover:bg-white/4">
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${entry.approved ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
                          {entry.approved ? "Approved" : "Denied"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-white">
                        {(entry.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)}
                      </td>
                      <td className="px-4 py-4 font-mono text-slate-300">
                        {shortenAddress(entry.targetProgram.toBase58(), 6)}
                      </td>
                      <td className="px-4 py-4 text-slate-300">
                        {DENIAL_REASONS[entry.denialReason] || `Code ${entry.denialReason}`}
                      </td>
                      <td className="max-w-[260px] px-4 py-4 text-slate-300">
                        <span className="block truncate">{entry.memo || "—"}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-300">
                        {new Date(entry.timestamp.toNumber() * 1000).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {hasMoreAuditEntries && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMoreAuditEntries}
                disabled={loadingMoreAuditEntries}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8 disabled:opacity-50"
              >
                {loadingMoreAuditEntries ? "Loading audit..." : "Load More Audit"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "slate" | "emerald" | "red";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-400/12 bg-cyan-400/10 text-cyan-200"
      : tone === "emerald"
      ? "border-emerald-400/12 bg-emerald-400/10 text-emerald-100"
      : tone === "red"
      ? "border-red-500/12 bg-red-500/10 text-red-100"
      : "border-white/8 bg-white/[0.03] text-white";

  return (
    <div className={`rounded-[1.5rem] border p-4 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">{value}</div>
    </div>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-2 mb-4 text-sm leading-7 text-slate-300">{desc}</p>
      {children}
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/15 px-4 py-3 text-sm">
      <span className="text-slate-300">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

type EditableMintRule = {
  id: string;
  mint: string;
  maxPerTx: string;
  maxDaily: string;
  requireApprovalAbove: string;
};

function createEditableMintRule(rule?: MintRuleData): EditableMintRule {
  return {
    id: crypto.randomUUID(),
    mint: rule?.mint.toBase58() || "",
    maxPerTx: rule ? (rule.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toString() : "",
    maxDaily: rule ? (rule.maxDaily.toNumber() / LAMPORTS_PER_SOL).toString() : "",
    requireApprovalAbove: rule?.requireApprovalAbove
      ? (rule.requireApprovalAbove.toNumber() / LAMPORTS_PER_SOL).toString()
      : "",
  };
}

function PolicyEditor({
  address,
  currentPolicy,
  onDone,
}: {
  address: string;
  currentPolicy: PolicyAccountData | null;
  onDone: () => void;
}) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const walletPubkey = useMemo(() => new PublicKey(address), [address]);

  const [maxPerTx, setMaxPerTx] = useState(
    currentPolicy ? (currentPolicy.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toString() : "0.1"
  );
  const [maxDaily, setMaxDaily] = useState(
    currentPolicy ? (currentPolicy.maxDaily.toNumber() / LAMPORTS_PER_SOL).toString() : "1"
  );
  const [allowedPrograms, setAllowedPrograms] = useState(
    currentPolicy?.allowedPrograms?.map((program: PublicKey) => program.toBase58()).join("\n") || ""
  );
  const [allowedRecipients, setAllowedRecipients] = useState(
    currentPolicy?.allowedRecipients?.map((recipient: PublicKey) => recipient.toBase58()).join("\n") || ""
  );
  const [blockedMints, setBlockedMints] = useState(
    currentPolicy?.blockedMints?.map((mint: PublicKey) => mint.toBase58()).join("\n") || ""
  );
  const [approvalThreshold, setApprovalThreshold] = useState(
    currentPolicy?.approvalThreshold ? (currentPolicy.approvalThreshold.toNumber() / LAMPORTS_PER_SOL).toString() : ""
  );
  const [requireApprovalForNewRecipients, setRequireApprovalForNewRecipients] = useState(
    Boolean(currentPolicy?.requireApprovalForNewRecipients)
  );
  const [timeStart, setTimeStart] = useState(
    currentPolicy?.timeWindowStart ? Math.floor(currentPolicy.timeWindowStart.toNumber() / 3600).toString() : ""
  );
  const [timeEnd, setTimeEnd] = useState(
    currentPolicy?.timeWindowEnd ? Math.floor(currentPolicy.timeWindowEnd.toNumber() / 3600).toString() : ""
  );
  const [mintRules, setMintRules] = useState<EditableMintRule[]>(() =>
    currentPolicy?.mintRules?.length
      ? currentPolicy.mintRules.map((rule: MintRuleData) => createEditableMintRule(rule))
      : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anchorWallet) return;

    try {
      setSubmitting(true);
      setError(null);

      const program = getProgram(connection, anchorWallet);
      const [policyPda] = getPolicyPda(walletPubkey);

      const nextAllowedPrograms = allowedPrograms
        .split("\n")
        .map((value: string) => value.trim())
        .filter(Boolean)
        .map((value: string) => new PublicKey(value));
      const nextAllowedRecipients = allowedRecipients
        .split("\n")
        .map((value: string) => value.trim())
        .filter(Boolean)
        .map((value: string) => new PublicKey(value));
      const nextBlockedMints = blockedMints
        .split("\n")
        .map((value: string) => value.trim())
        .filter(Boolean)
        .map((value: string) => new PublicKey(value));
      const nextMintRules = mintRules
        .filter((rule) => rule.mint.trim().length > 0)
        .map((rule) => {
          if (!rule.maxPerTx || !rule.maxDaily) {
            throw new Error("Each mint rule must include a mint, max per tx, and daily limit.");
          }

          return {
            mint: new PublicKey(rule.mint.trim()),
            maxPerTx: new BN(Math.floor(parseFloat(rule.maxPerTx) * LAMPORTS_PER_SOL)),
            maxDaily: new BN(Math.floor(parseFloat(rule.maxDaily) * LAMPORTS_PER_SOL)),
            requireApprovalAbove: rule.requireApprovalAbove
              ? new BN(Math.floor(parseFloat(rule.requireApprovalAbove) * LAMPORTS_PER_SOL))
              : null,
          };
        });

      const nextTimeStart = timeStart ? new BN(parseInt(timeStart, 10) * 3600) : null;
      const nextTimeEnd = timeEnd ? new BN(parseInt(timeEnd, 10) * 3600) : null;

      await program.methods
        .updatePolicy(
          new BN(Math.floor(parseFloat(maxPerTx) * LAMPORTS_PER_SOL)),
          new BN(Math.floor(parseFloat(maxDaily) * LAMPORTS_PER_SOL)),
          approvalThreshold ? new BN(Math.floor(parseFloat(approvalThreshold) * LAMPORTS_PER_SOL)) : null,
          requireApprovalForNewRecipients,
          nextAllowedPrograms,
          nextAllowedRecipients,
          nextBlockedMints,
          nextMintRules,
          nextTimeStart,
          nextTimeEnd
        )
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: walletPubkey,
          policy: policyPda,
        })
        .rpc();

      onDone();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Policy update failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Max Per Tx (SOL)">
          <input
            type="number"
            step="0.001"
            min="0"
            required
            value={maxPerTx}
            onChange={(e) => setMaxPerTx(e.target.value)}
            className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          />
        </Field>
        <Field label="Max Daily (SOL)">
          <input
            type="number"
            step="0.001"
            min="0"
            required
            value={maxDaily}
            onChange={(e) => setMaxDaily(e.target.value)}
            className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          />
        </Field>
      </div>

      <Field label="Allowed Programs" helper="one program ID per line">
        <textarea
          value={allowedPrograms}
          onChange={(e) => setAllowedPrograms(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
        />
      </Field>

      <Field label="Allowed Recipients" helper="one recipient per line">
        <textarea
          value={allowedRecipients}
          onChange={(e) => setAllowedRecipients(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
        />
      </Field>

      <Field label="Blocked Mints" helper="one mint per line">
        <textarea
          value={blockedMints}
          onChange={(e) => setBlockedMints(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 font-mono text-sm text-white focus:border-cyan-400 focus:outline-none"
        />
      </Field>

      <Field label="Approval Threshold (SOL)">
        <input
          type="number"
          step="0.001"
          min="0"
          value={approvalThreshold}
          onChange={(e) => setApprovalThreshold(e.target.value)}
          className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
        />
      </Field>

      <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
          Mint Rules
        </div>
        <div className="mb-3 text-xs text-slate-300">
          Add asset-specific limits and approval thresholds for governed SPL mints or native SOL.
        </div>
        <div className="space-y-3">
          {mintRules.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              No mint-specific overrides configured.
            </div>
          ) : (
            mintRules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
                  <input
                    type="text"
                    value={rule.mint}
                    onChange={(event) =>
                      setMintRules((current) =>
                        current.map((entry) =>
                          entry.id === rule.id ? { ...entry, mint: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Mint address"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={rule.maxPerTx}
                    onChange={(event) =>
                      setMintRules((current) =>
                        current.map((entry) =>
                          entry.id === rule.id ? { ...entry, maxPerTx: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Max / tx"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={rule.maxDaily}
                    onChange={(event) =>
                      setMintRules((current) =>
                        current.map((entry) =>
                          entry.id === rule.id ? { ...entry, maxDaily: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Daily limit"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={rule.requireApprovalAbove}
                    onChange={(event) =>
                      setMintRules((current) =>
                        current.map((entry) =>
                          entry.id === rule.id ? { ...entry, requireApprovalAbove: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Approval above"
                    className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMintRules((current) => current.filter((entry) => entry.id !== rule.id))}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-red-200 transition-colors hover:bg-red-500/15"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={() => setMintRules((current) => [...current, createEditableMintRule()])}
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 transition-colors hover:bg-cyan-400/15"
          >
            Add Mint Rule
          </button>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={requireApprovalForNewRecipients}
          onChange={(event) => setRequireApprovalForNewRecipients(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-black/20 text-cyan-400"
        />
        Require approval for new recipients
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Time Start (UTC hour)">
          <input
            type="number"
            min="0"
            max="23"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
            className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          />
        </Field>
        <Field label="Time End (UTC hour)">
          <input
            type="number"
            min="0"
            max="23"
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
            className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Updating..." : "Update Policy"}
      </button>
    </form>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
        {label}
      </div>
      {helper && <div className="mb-2 text-xs text-slate-300">{helper}</div>}
      {children}
    </label>
  );
}
