"use client";

import { use, useState, useCallback } from "react";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import Link from "next/link";
import {
  getProgram,
  getPolicyPda,
  getTrackerPda,
  shortenAddress,
  DENIAL_REASONS,
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
  const { walletAccount, policy, tracker, auditEntries, loading, error, refresh } =
    useWalletDetail(address);

  const [fundAmount, setFundAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [txPending, setTxPending] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);

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
      const walletPubkey = new PublicKey(address);
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
  }, [anchorWallet, connection, address, fundAmount, refresh]);

  const handleWithdraw = useCallback(async () => {
    if (!anchorWallet || !withdrawAmount) return;
    clearMessages();
    setTxPending("Withdrawing...");
    try {
      const program = getProgram(connection, anchorWallet);
      const walletPubkey = new PublicKey(address);
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
  }, [anchorWallet, connection, address, withdrawAmount, refresh]);

  const handleFreeze = useCallback(async () => {
    if (!anchorWallet) return;
    clearMessages();
    const isFrozen = walletAccount?.account.frozen;
    setTxPending(isFrozen ? "Unfreezing..." : "Freezing...");
    try {
      const program = getProgram(connection, anchorWallet);
      const walletPubkey = new PublicKey(address);

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
  }, [anchorWallet, connection, address, walletAccount, refresh]);

  if (!connected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <p className="text-gray-400">Connect your wallet to continue.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
        <span className="ml-3 text-gray-400">Loading wallet...</span>
      </div>
    );
  }

  if (error || !walletAccount) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error || "Wallet not found"}</p>
        <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { account, balance } = walletAccount;
  const totalTx = account.totalApproved.toNumber() + account.totalDenied.toNumber();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        href="/dashboard"
        className="text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-6 inline-block"
      >
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-mono">
              {shortenAddress(address, 8)}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                account.frozen
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {account.frozen ? "Frozen" : "Active"}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Agent:{" "}
            <span className="font-mono text-gray-300">
              {shortenAddress(account.agent.toBase58(), 6)}
            </span>
          </p>
        </div>

        <button
          onClick={handleFreeze}
          disabled={!!txPending}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            account.frozen
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
          } disabled:opacity-50`}
        >
          {account.frozen ? "🔓 Unfreeze" : "🔒 Freeze (Kill Switch)"}
        </button>
      </div>

      {/* Status Messages */}
      {txPending && (
        <div className="mb-6 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent mr-2" />
          {txPending}
        </div>
      )}
      {txSuccess && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          ✓ {txSuccess}
        </div>
      )}
      {txError && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ✗ {txError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Balance" value={`${balance.toFixed(4)} SOL`} />
        <StatCard label="Total Tx" value={totalTx.toString()} />
        <StatCard label="Approved" value={account.totalApproved.toString()} accent="emerald" />
        <StatCard label="Denied" value={account.totalDenied.toString()} accent="red" />
      </div>

      {/* Fund / Withdraw */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div className="p-6 rounded-2xl border border-[#1e293b] bg-[#111827]/50">
          <h3 className="text-lg font-semibold text-white mb-4">Fund Wallet</h3>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.001"
              min="0"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="Amount in SOL"
              className="flex-1 px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleFund}
              disabled={!!txPending || !fundAmount}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
            >
              Fund
            </button>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[#1e293b] bg-[#111827]/50">
          <h3 className="text-lg font-semibold text-white mb-4">Withdraw</h3>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.001"
              min="0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Amount in SOL"
              className="flex-1 px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleWithdraw}
              disabled={!!txPending || !withdrawAmount}
              className="px-6 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold hover:bg-amber-500/20 transition-all disabled:opacity-50"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Policy Section */}
      <div className="p-6 rounded-2xl border border-[#1e293b] bg-[#111827]/50 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Spending Policy</h3>
          <button
            onClick={() => setShowPolicyEditor(!showPolicyEditor)}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            {showPolicyEditor ? "Cancel" : "Edit Policy"}
          </button>
        </div>

        {policy ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <PolicyField
              label="Max Per Transaction"
              value={`${(policy.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`}
            />
            <PolicyField
              label="Max Daily Budget"
              value={`${(policy.maxDaily.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`}
            />
            <PolicyField
              label="Allowed Programs"
              value={
                policy.allowedPrograms.length === 0
                  ? "All programs"
                  : `${policy.allowedPrograms.length} program(s)`
              }
            />
            <PolicyField
              label="Time Window"
              value={
                policy.timeWindowStart
                  ? `${Math.floor(policy.timeWindowStart.toNumber() / 3600)}:00 – ${
                      policy.timeWindowEnd
                        ? Math.floor(policy.timeWindowEnd.toNumber() / 3600)
                        : "24"
                    }:00 UTC`
                  : "24/7 (no restriction)"
              }
            />
          </div>
        ) : (
          <p className="text-gray-400">Policy not found.</p>
        )}

        {tracker && (
          <div className="mt-4 pt-4 border-t border-[#1e293b]">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-gray-500">Spent this period: </span>
                <span className="text-white font-semibold">
                  {(tracker.spentInPeriod.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </span>
              </div>
              {policy && (
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-[#1e293b] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                      style={{
                        width: `${Math.min(
                          100,
                          (tracker.spentInPeriod.toNumber() /
                            Math.max(policy.maxDaily.toNumber(), 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showPolicyEditor && (
          <PolicyEditor
            address={address}
            currentPolicy={policy}
            onDone={() => {
              setShowPolicyEditor(false);
              refresh();
            }}
          />
        )}
      </div>

      {/* Audit Log */}
      <div className="p-6 rounded-2xl border border-[#1e293b] bg-[#111827]/50">
        <h3 className="text-lg font-semibold text-white mb-4">
          Audit Trail{" "}
          <span className="text-sm font-normal text-gray-500">
            ({auditEntries.length} entries)
          </span>
        </h3>

        {auditEntries.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No transactions yet. The audit trail will appear when the agent
            starts transacting.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-[#1e293b]">
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Target</th>
                  <th className="pb-3 pr-4">Reason</th>
                  <th className="pb-3 pr-4">Memo</th>
                  <th className="pb-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((entry, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/20"
                  >
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          entry.approved
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {entry.approved ? "✓ Approved" : "✗ Denied"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-white">
                      {(entry.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(4)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-gray-300">
                      {shortenAddress(entry.targetProgram.toBase58())}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {DENIAL_REASONS[entry.denialReason] || `Code ${entry.denialReason}`}
                    </td>
                    <td className="py-3 pr-4 text-gray-400 max-w-[200px] truncate">
                      {entry.memo || "—"}
                    </td>
                    <td className="py-3 text-gray-500 whitespace-nowrap">
                      {new Date(entry.timestamp.toNumber() * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const colorClass =
    accent === "emerald"
      ? "text-emerald-400"
      : accent === "red"
      ? "text-red-400"
      : "text-white";
  return (
    <div className="p-4 rounded-xl border border-[#1e293b] bg-[#111827]/50">
      <div className="text-xs text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div className={`text-xl font-bold mt-1 ${colorClass}`}>{value}</div>
    </div>
  );
}

function PolicyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-white">{value}</div>
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
    currentPolicy
      ? (currentPolicy.maxPerTx.toNumber() / LAMPORTS_PER_SOL).toString()
      : "0.1"
  );
  const [maxDaily, setMaxDaily] = useState(
    currentPolicy
      ? (currentPolicy.maxDaily.toNumber() / LAMPORTS_PER_SOL).toString()
      : "1"
  );
  const [allowedPrograms, setAllowedPrograms] = useState(
    currentPolicy?.allowedPrograms
      ?.map((p: PublicKey) => p.toBase58())
      .join("\n") || ""
  );
  const [timeStart, setTimeStart] = useState(
    currentPolicy?.timeWindowStart
      ? Math.floor(currentPolicy.timeWindowStart.toNumber() / 3600).toString()
      : ""
  );
  const [timeEnd, setTimeEnd] = useState(
    currentPolicy?.timeWindowEnd
      ? Math.floor(currentPolicy.timeWindowEnd.toNumber() / 3600).toString()
      : ""
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

      const newMaxPerTx = new BN(Math.floor(parseFloat(maxPerTx) * LAMPORTS_PER_SOL));
      const newMaxDaily = new BN(Math.floor(parseFloat(maxDaily) * LAMPORTS_PER_SOL));

      const programs = allowedPrograms
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((s: string) => new PublicKey(s));

      const twStart = timeStart ? new BN(parseInt(timeStart) * 3600) : null;
      const twEnd = timeEnd ? new BN(parseInt(timeEnd) * 3600) : null;

      await program.methods
        .updatePolicy(newMaxPerTx, newMaxDaily, programs.length > 0 ? programs : null, twStart, twEnd)
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: walletPubkey,
          policy: policyPda,
        })
        .rpc();

      onDone();
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-[#1e293b] space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Max Per Tx (SOL)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            required
            value={maxPerTx}
            onChange={(e) => setMaxPerTx(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Max Daily (SOL)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            required
            value={maxDaily}
            onChange={(e) => setMaxDaily(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">
          Allowed Programs (one per line)
        </label>
        <textarea
          value={allowedPrograms}
          onChange={(e) => setAllowedPrograms(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Time Start (hour UTC)
          </label>
          <input
            type="number"
            min="0"
            max="23"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Time End (hour UTC)
          </label>
          <input
            type="number"
            min="0"
            max="23"
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50"
      >
        {submitting ? "Updating..." : "Update Policy"}
      </button>
    </form>
  );
}
