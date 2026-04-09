"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useWallets } from "@/hooks/useTavsin";
import WalletCard from "@/components/WalletCard";
import CreateWalletModal from "@/components/CreateWalletModal";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export default function DashboardPage() {
  const { connected } = useWallet();
  const { wallets, loading, error, refresh, lastSyncedAt } = useWallets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const policyCount = wallets.filter((wallet) => wallet.policy).length;
  const trackerCount = wallets.filter((wallet) => wallet.tracker).length;

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
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Wallets"
              value={wallets.length.toString()}
              tone="cyan"
            />
            <StatCard
              label="Total Balance"
              value={`${wallets
                .reduce((sum, w) => sum + w.balance, 0)
                .toFixed(4)} SOL`}
              tone="slate"
            />
            <StatCard
              label="Policy Coverage"
              value={`${policyCount}/${wallets.length}`}
              tone="emerald"
            />
            <StatCard
              label="Tracker Coverage"
              value={`${trackerCount}/${wallets.length}`}
              tone="amber"
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <span className="ml-3 text-slate-400">Loading protocol state...</span>
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
  tone: "cyan" | "slate" | "emerald" | "amber";
}) {
  const toneClasses = {
    cyan: "from-cyan-400/12 to-sky-400/5 border-cyan-400/12",
    slate: "from-white/6 to-white/[0.02] border-white/8",
    emerald: "from-emerald-400/12 to-emerald-400/5 border-emerald-400/12",
    amber: "from-amber-300/12 to-amber-300/5 border-amber-300/12",
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
