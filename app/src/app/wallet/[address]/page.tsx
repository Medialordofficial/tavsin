"use client";

import { use, useCallback, useState } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import Link from "next/link";
import {
  DENIAL_REASONS,
  getPolicyPda,
  getProgram,
  getTrackerPda,
  shortenAddress,
} from "@/lib/program";
import { useWalletDetail } from "@/hooks/useTavsin";

export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const { connected } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const {
    walletAccount,
    policy,
    tracker,
    auditEntries,
    loading,
    error,
    refresh,
  } = useWalletDetail(address);

  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [txPending, setTxPending] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

  const walletPubkey = new PublicKey(address);

  const clearMessages = () => {
    setTxError(null);
    setTxSuccess(null);
  };

  const handleFund = useCallback(async () => {
    if (!anchorWallet || !fundAmount) return;

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
    } catch (err: any) {
      setTxError(err.message || "Funding failed");
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, fundAmount, refresh, walletPubkey]);

  const handleWithdraw = useCallback(async () => {
    if (!anchorWallet || !withdrawAmount) return;

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
    } catch (err: any) {
      setTxError(err.message || "Withdrawal failed");
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, refresh, withdrawAmount, walletPubkey]);

  const handleFreeze = useCallback(async () => {
    if (!anchorWallet) return;

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
    } catch (err: any) {
      setTxError(err.message || "Action failed");
    } finally {
      setTxPending(null);
    }
  }, [anchorWallet, connection, refresh, walletAccount?.account.frozen, walletPubkey]);

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
  const totalTx = account.totalApproved.toNumber() + account.totalDenied.toNumber();
  const approvalRate = totalTx > 0 ? Math.round((account.totalApproved.toNumber() / totalTx) * 100) : 100;
  const statusLabel = account.frozen ? "Frozen" : "Active";
  const statusTone = account.frozen
    ? "border-red-500/20 bg-red-500/10 text-red-300"
    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  const createdAt = new Date(account.createdAt.toNumber() * 1000).toLocaleString();

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
                    disabled={!!txPending || !fundAmount}
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
                    disabled={!!txPending || !withdrawAmount}
                    className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-amber-200 transition-colors hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Withdraw
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
                <div className="space-y-4">
                  <MiniRow label="Max / Tx" value={`${(policy.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`} />
                  <MiniRow label="Daily Budget" value={`${(policy.maxDaily.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`} />
                  <MiniRow
                    label="Allowed Programs"
                    value={policy.allowedPrograms.length === 0 ? "All programs" : `${policy.allowedPrograms.length} allowlisted`}
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
              ) : (
                <p className="text-sm leading-7 text-slate-300">Policy account not found for this wallet.</p>
              )}

              {tracker && policy && (
                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Spent in period</span>
                    <span className="font-semibold text-white">
                      {(tracker.spentInPeriod.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-300"
                      style={{
                        width: `${Math.min(100, (tracker.spentInPeriod.toNumber() / Math.max(policy.maxDaily.toNumber(), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

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
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.94),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)]">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Audit Summary
              </div>
              <div className="grid gap-3">
                <MiniRow label="Approved" value={account.totalApproved.toString()} />
                <MiniRow label="Denied" value={account.totalDenied.toString()} />
                <MiniRow label="Decisions" value={totalTx.toString()} />
                <MiniRow label="Memo Log" value={auditEntries.length > 0 ? `${auditEntries.length} entries` : "Empty"} />
              </div>
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
              {auditEntries.length} entries
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

function PolicyEditor({
  address,
  currentPolicy,
  onDone,
}: {
  address: string;
  currentPolicy: any;
  onDone: () => void;
}) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [maxPerTx, setMaxPerTx] = useState(
    currentPolicy ? (currentPolicy.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toString() : "0.1"
  );
  const [maxDaily, setMaxDaily] = useState(
    currentPolicy ? (currentPolicy.maxDaily.toNumber() / LAMPORTS_PER_SOL).toString() : "1"
  );
  const [allowedPrograms, setAllowedPrograms] = useState(
    currentPolicy?.allowedPrograms?.map((program: PublicKey) => program.toBase58()).join("\n") || ""
  );
  const [timeStart, setTimeStart] = useState(
    currentPolicy?.timeWindowStart ? Math.floor(currentPolicy.timeWindowStart.toNumber() / 3600).toString() : ""
  );
  const [timeEnd, setTimeEnd] = useState(
    currentPolicy?.timeWindowEnd ? Math.floor(currentPolicy.timeWindowEnd.toNumber() / 3600).toString() : ""
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
      const walletPubkey = new PublicKey(address);
      const [policyPda] = getPolicyPda(walletPubkey);

      const nextAllowedPrograms = allowedPrograms
        .split("\n")
        .map((value: string) => value.trim())
        .filter(Boolean)
        .map((value: string) => new PublicKey(value));

      const nextTimeStart = timeStart ? new BN(parseInt(timeStart, 10) * 3600) : null;
      const nextTimeEnd = timeEnd ? new BN(parseInt(timeEnd, 10) * 3600) : null;

      await program.methods
        .updatePolicy(
          new BN(Math.floor(parseFloat(maxPerTx) * LAMPORTS_PER_SOL)),
          new BN(Math.floor(parseFloat(maxDaily) * LAMPORTS_PER_SOL)),
          nextAllowedPrograms.length > 0 ? nextAllowedPrograms : null,
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
    } catch (err: any) {
      setError(err.message || "Policy update failed");
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
