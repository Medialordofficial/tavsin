"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePendingApprovalQueue, useWallets } from "@/hooks/useTavsin";
import WalletCard from "@/components/WalletCard";
import CreateWalletModal from "@/components/CreateWalletModal";
import { NATIVE_MINT, REQUEST_STATUSES, shortenAddress } from "@tavsin/sdk";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function DashboardPage() {
  const { connected } = useWallet();
  const { wallets, total, hasMore, loadingMore, loading, error, refresh, loadMore, lastSyncedAt } = useWallets();
  const {
    items: pendingApprovals,
    total: pendingApprovalsTotal,
    hasMore: hasMorePendingApprovals,
    loadingMore: loadingMorePendingApprovals,
    loading: pendingApprovalsLoading,
    error: pendingApprovalsError,
    refresh: refreshPendingApprovals,
    loadMore: loadMorePendingApprovals,
  } = usePendingApprovalQueue();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const policyCount = wallets.filter((wallet) => wallet.policy).length;
  const trackerCount = wallets.filter((wallet) => wallet.tracker).length;
  const pendingApprovalCount = pendingApprovalsTotal;

  const fleetStats = useMemo(() => {
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const frozenCount = wallets.filter((w) => w.account.frozen).length;
    const totalApproved = wallets.reduce((s, w) => s + w.account.totalApproved.toNumber(), 0);
    const totalDenied = wallets.reduce((s, w) => s + w.account.totalDenied.toNumber(), 0);
    const totalTx = totalApproved + totalDenied;
    const fleetApprovalRate = totalTx > 0 ? Math.round((totalApproved / totalTx) * 100) : 100;

    const walletBars = wallets.slice(0, 12).map((w) => {
      const utilization = w.policy && w.tracker
        ? Math.min(100, (w.tracker.spentInPeriod.toNumber() / Math.max(w.policy.maxDaily.toNumber(), 1)) * 100)
        : 0;
      return {
        address: w.publicKey.toBase58(),
        balance: w.balance,
        utilization,
        frozen: w.account.frozen,
        pending: w.account.totalPending.toNumber(),
      };
    });
    const maxBalance = Math.max(...walletBars.map((b) => b.balance), 0.001);

    return { totalBalance, frozenCount, totalApproved, totalDenied, totalTx, fleetApprovalRate, walletBars, maxBalance };
  }, [wallets]);

  // Anomaly detection
  const anomalies = useMemo(() => {
    const alerts: { severity: "critical" | "warning" | "info"; message: string; wallet?: string }[] = [];

    for (const bar of fleetStats.walletBars) {
      if (bar.frozen) {
        alerts.push({ severity: "critical", message: `Wallet ${bar.address.slice(0, 6)}… is frozen`, wallet: bar.address });
      }
      if (bar.utilization > 80) {
        alerts.push({ severity: "warning", message: `Wallet ${bar.address.slice(0, 6)}… at ${bar.utilization.toFixed(0)}% daily spend`, wallet: bar.address });
      }
      if (bar.pending > 0) {
        alerts.push({ severity: "info", message: `Wallet ${bar.address.slice(0, 6)}… has ${bar.pending} pending review${bar.pending > 1 ? "s" : ""}`, wallet: bar.address });
      }
    }

    if (fleetStats.totalTx > 0 && fleetStats.fleetApprovalRate < 80) {
      alerts.push({ severity: "warning", message: `Fleet denial rate high — ${100 - fleetStats.fleetApprovalRate}% of transactions denied` });
    }

    return alerts;
  }, [fleetStats]);

  if (!connected) {
    return (
      <div className="relative min-h-[80vh] overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_22%),radial-gradient(circle_at_82%_15%,rgba(245,158,11,0.12),transparent_18%)]" />
          <div className="absolute left-0 right-0 top-20 h-[420px] tavsin-grid-mask" />
        </div>
        <div className="relative flex min-h-[80vh] flex-col items-center justify-center">
          <div className="tavsin-fade-up rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(8,12,24,0.98))] px-8 py-10 text-center shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            <Image
              src="/logo.png"
              alt="TavSin"
              width={80}
              height={80}
              className="mx-auto mb-6 rounded-2xl ring-1 ring-white/10"
            />
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Dashboard Access
            </div>
            <h2 className="mb-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Connect Your Wallet
            </h2>
            <p className="mb-8 max-w-md text-center leading-7 text-slate-300">
              Connect a Solana wallet to access your smart-wallet control
              surface, funding rails, and policy management flows.
            </p>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_18%),radial-gradient(circle_at_90%_8%,rgba(245,158,11,0.1),transparent_14%)]" />
        <div className="absolute left-0 right-0 top-16 h-[380px] tavsin-grid-mask" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="tavsin-fade-up">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Protocol Dashboard
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Manage agent capital like an operator, not a spectator.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              View wallet state, monitor approvals, control freeze status, and
              create new capital mandates for autonomous agents.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
              <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 uppercase tracking-[0.22em] text-slate-300">
                {policyCount}/{wallets.length || 0} wallets with policies
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 uppercase tracking-[0.22em] text-slate-300">
                {trackerCount}/{wallets.length || 0} wallets with live trackers
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 uppercase tracking-[0.22em] text-slate-300">
                {pendingApprovalCount} pending reviews
              </div>
              <div className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 uppercase tracking-[0.22em] text-slate-300">
                {lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Syncing live state"}
              </div>
            </div>
          </div>
          <div className="tavsin-fade-up tavsin-delay-1 flex flex-col gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-300 to-sky-400 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_20px_70px_rgba(56,189,248,0.22)] transition-transform hover:-translate-y-0.5"
            >
              Create Wallet
            </button>
            <button
              onClick={refresh}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8"
            >
              Refresh Live Data
            </button>
          </div>
        </div>

        {wallets.length > 0 && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Wallets" value={wallets.length.toString()} tone="cyan" />
              <StatCard label="Total Balance" value={`${fleetStats.totalBalance.toFixed(4)} SOL`} tone="slate" />
              <StatCard label="Policy Coverage" value={`${policyCount}/${wallets.length}`} tone="emerald" />
              <StatCard label="Approval Rate" value={`${fleetStats.fleetApprovalRate}%`} tone="emerald" />
              <StatCard label="Pending Reviews" value={pendingApprovalCount.toString()} tone="amber" />
              <StatCard label="Frozen Wallets" value={fleetStats.frozenCount.toString()} tone={fleetStats.frozenCount > 0 ? "red" : "slate"} />
              <StatCard label="Total Approved" value={fleetStats.totalApproved.toString()} tone="emerald" />
              <StatCard label="Total Denied" value={fleetStats.totalDenied.toString()} tone={fleetStats.totalDenied > 0 ? "red" : "slate"} />
            </div>

            {anomalies.length > 0 && (
              <div className="mb-4 rounded-[1.5rem] border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-300">
                  Anomaly Alerts
                </div>
                <div className="space-y-2">
                  {anomalies.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                        a.severity === "critical"
                          ? "border border-red-500/20 bg-red-500/10 text-red-200"
                          : a.severity === "warning"
                            ? "border border-amber-400/20 bg-amber-400/10 text-amber-200"
                            : "border border-cyan-400/15 bg-cyan-400/5 text-cyan-200"
                      }`}
                    >
                      <span className="text-base">
                        {a.severity === "critical" ? "🔴" : a.severity === "warning" ? "⚠️" : "ℹ️"}
                      </span>
                      {a.wallet ? (
                        <Link href={`/wallet/${a.wallet}`} className="underline decoration-white/20 hover:decoration-white/40">
                          {a.message}
                        </Link>
                      ) : (
                        <span>{a.message}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(8,12,24,0.98))] p-6 shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Fleet Activity
              </div>
              <h3 className="mb-5 text-lg font-semibold tracking-[-0.03em] text-white">
                Balance & daily utilization across wallets
              </h3>
              {fleetStats.walletBars.length > 0 ? (
                <div className="flex items-end gap-2" style={{ height: 160 }}>
                  {fleetStats.walletBars.map((bar) => {
                    const balPct = Math.max(4, (bar.balance / fleetStats.maxBalance) * 100);
                    return (
                      <Link
                        key={bar.address}
                        href={`/wallet/${bar.address}`}
                        className="group relative flex flex-1 flex-col items-center justify-end"
                        style={{ height: "100%" }}
                        title={`${bar.balance.toFixed(4)} SOL — ${bar.utilization.toFixed(0)}% daily used`}
                      >
                        <div
                          className={`w-full min-w-[12px] rounded-t-lg transition-all group-hover:opacity-80 ${
                            bar.frozen
                              ? "bg-red-500/60"
                              : bar.utilization > 80
                                ? "bg-amber-400/60"
                                : "bg-gradient-to-t from-cyan-500/40 to-cyan-300/60"
                          }`}
                          style={{ height: `${balPct}%` }}
                        />
                        {bar.utilization > 0 && (
                          <div
                            className="absolute bottom-0 left-0 w-full rounded-t-lg bg-white/10"
                            style={{ height: `${Math.max(2, bar.utilization)}%` }}
                          />
                        )}
                        {bar.pending > 0 && (
                          <div className="absolute -top-1 right-0 h-2 w-2 rounded-full bg-amber-400" />
                        )}
                        <div className="mt-2 text-[9px] font-mono text-slate-500 transition-colors group-hover:text-cyan-300">
                          {bar.address.slice(0, 3)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-400">No wallets to chart.</div>
              )}
              <div className="mt-4 flex flex-wrap gap-4 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-cyan-500/40 to-cyan-300/60" /> Balance</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-white/10" /> Utilization</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/60" /> Frozen</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Pending</span>
              </div>
            </div>
          </>
        )}

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(8,12,24,0.98))] p-6 shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                  Approval Queue
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                  Fleet-wide reviews waiting on owners
                </h2>
              </div>
              <button
                onClick={() => {
                  refresh();
                  refreshPendingApprovals();
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8"
              >
                Refresh Queue
              </button>
            </div>

            {pendingApprovalsLoading ? (
              <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-8 text-sm text-slate-300">
                Loading approval queue...
              </div>
            ) : pendingApprovalsError ? (
              <div className="rounded-[1.5rem] border border-red-500/20 bg-red-500/5 px-5 py-8 text-sm text-red-200">
                {pendingApprovalsError}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/8 bg-black/15 px-5 py-8 text-sm text-slate-300">
                No wallet in this fleet is currently waiting on manual approval.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((item) => (
                  <div
                    key={`${item.wallet.toBase58()}-${item.request.requestId.toString()}`}
                    className="rounded-[1.5rem] border border-white/8 bg-black/15 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {(item.request.amount.toNumber() / 1_000_000_000).toFixed(4)} {item.request.assetMint.equals(NATIVE_MINT) ? "SOL" : "asset"}
                        </div>
                        <div className="mt-1 text-xs font-mono text-slate-400">
                          Wallet {shortenAddress(item.wallet.toBase58(), 6)}
                        </div>
                      </div>
                      <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                        {REQUEST_STATUSES[item.request.status] || `Status ${item.request.status}`}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                      <div>Recipient {shortenAddress(item.request.recipient.toBase58(), 6)}</div>
                      <div>Agent {shortenAddress(item.agent.toBase58(), 6)}</div>
                      <div>{new Date(item.request.requestedAt.toNumber() * 1000).toLocaleString()}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="max-w-2xl text-sm text-slate-300">
                        {item.request.memo || "No memo provided."}
                      </div>
                      <Link
                        href={`/wallet/${item.wallet.toBase58()}`}
                        className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/15"
                      >
                        Review Wallet
                      </Link>
                    </div>
                  </div>
                ))}
                {hasMorePendingApprovals && (
                  <button
                    onClick={loadMorePendingApprovals}
                    disabled={loadingMorePendingApprovals}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8 disabled:opacity-50"
                  >
                    {loadingMorePendingApprovals ? "Loading queue..." : "Load More Reviews"}
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(8,12,24,0.98))] p-6 shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Protocol Evidence
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
              Not a demo — a real protocol
            </h3>

            <div className="mt-5 space-y-3">
              {[
                { label: "On-chain program", value: "Deployed", tone: "emerald" as const },
                { label: "Integration tests", value: "11/11 passing", tone: "emerald" as const },
                { label: "Policy checks per tx", value: "7 checks", tone: "cyan" as const },
                { label: "Instructions", value: "12 total", tone: "cyan" as const },
                { label: "Approval workflow", value: "On-chain", tone: "emerald" as const },
                { label: "Audit trail", value: "Immutable", tone: "emerald" as const },
                { label: "SPL token support", value: "Full CPI", tone: "emerald" as const },
                { label: "Counterparty rules", value: "Per-recipient", tone: "cyan" as const },
              ].map((item) => {
                const toneMap = {
                  emerald: "border-emerald-400/15 bg-emerald-400/5 text-emerald-300",
                  cyan: "border-cyan-400/15 bg-cyan-400/5 text-cyan-200",
                };
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-black/15 px-4 py-3 text-sm"
                  >
                    <span className="text-slate-300">{item.label}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${toneMap[item.tone]}`}>
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-amber-300/15 bg-amber-300/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
                How it works
              </div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                Agent requests spend → TavSin evaluates 7 policy rules on-chain → approved, escalated, or blocked. Every decision is logged. The agent never holds keys.
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Positioning
              </div>
              <div className="mt-2 text-base font-semibold text-white">
                Squads for human multisig.
              </div>
              <div className="text-base font-semibold bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">
                TavSin for autonomous agents.
              </div>
            </div>
          </section>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="mb-3 h-3 w-20 animate-pulse rounded bg-white/10" />
                  <div className="h-6 w-16 animate-pulse rounded bg-white/8" />
                </div>
              ))}
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-4 h-4 w-32 animate-pulse rounded bg-white/10" />
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex-1 animate-pulse rounded-t-lg bg-white/8" style={{ height: `${30 + Math.random() * 60}%` }} />
                ))}
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[2rem] border border-white/8 bg-white/[0.02] p-5">
                  <div className="mb-3 h-4 w-32 animate-pulse rounded bg-white/10" />
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-white/6" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-white/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="tavsin-fade-up rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="mb-3 text-red-400">{error}</p>
            <button
              onClick={refresh}
              className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Retry fetch
            </button>
          </div>
        ) : wallets.length === 0 ? (
          <div className="tavsin-fade-up rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.9),rgba(8,12,24,0.98))] p-12 text-center shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Capital Setup
            </div>
            <div className="mb-4 text-4xl">🛡️</div>
            <h3 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-white">
              No wallets created yet
            </h3>
            <p className="mx-auto mb-7 max-w-xl leading-7 text-slate-400">
              Create your first TavSin wallet to define spend limits, attach an
              agent identity, and establish the first policy envelope for
              autonomous execution.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-slate-100"
            >
              Create First Wallet
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-300">
              <span>Showing {wallets.length} of {total} wallets</span>
              {hasMore && <span>More wallets available</span>}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {wallets.map((w, index) => (
                <div
                  key={w.publicKey.toBase58()}
                  className={`tavsin-fade-up ${index === 1 ? "tavsin-delay-1" : ""} ${index >= 2 ? "tavsin-delay-2" : ""}`}
                >
                  <WalletCard wallet={w} />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8 disabled:opacity-50"
                >
                  {loadingMore ? "Loading wallets..." : "Load More Wallets"}
                </button>
              </div>
            )}
          </>
        )}

        <CreateWalletModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={refresh}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "slate" | "emerald" | "amber" | "red";
}) {
  const toneClasses = {
    cyan: "from-cyan-400/12 to-sky-400/5 border-cyan-400/12",
    slate: "from-white/6 to-white/[0.02] border-white/8",
    emerald: "from-emerald-400/12 to-emerald-400/5 border-emerald-400/12",
    amber: "from-amber-300/12 to-amber-300/5 border-amber-300/12",
    red: "from-red-400/12 to-red-400/5 border-red-400/12",
  };

  return (
    <div
      className={`rounded-[1.5rem] border bg-gradient-to-b p-5 shadow-[0_10px_50px_rgba(0,0,0,0.18)] ${toneClasses[tone]}`}
    >
      <div className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </div>
    </div>
  );
}
