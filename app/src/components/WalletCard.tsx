"use client";

import Link from "next/link";
import { shortenAddress } from "@tavsin/sdk";
import type { WalletAccount } from "./WalletCardHelpers";

interface WalletCardProps {
  wallet: WalletAccount;
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const { publicKey, account, balance, policy, tracker } = wallet;
  const totalTx = account.totalApproved.toNumber() + account.totalDenied.toNumber();
  const approvalRate =
    totalTx > 0
      ? Math.round((account.totalApproved.toNumber() / totalTx) * 100)
      : 100;
  const utilization =
    policy && tracker
      ? Math.min(
          100,
          (tracker.spentInPeriod.toNumber() / Math.max(policy.maxDaily.toNumber(), 1)) * 100
        )
      : null;
  const timeWindow =
    policy?.timeWindowStart && policy?.timeWindowEnd
      ? `${Math.floor(policy.timeWindowStart.toNumber() / 3600)}:00-${Math.floor(
          policy.timeWindowEnd.toNumber() / 3600
        )}:00 UTC`
      : "24/7";

  return (
    <Link
      href={`/wallet/${publicKey.toBase58()}`}
      className="group block overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
            Wallet PDA
          </div>
          <div className="font-mono text-sm text-white">
            {shortenAddress(publicKey.toBase58(), 6)}
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            account.frozen
              ? "border border-red-500/20 bg-red-500/10 text-red-400"
              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {account.frozen ? "Frozen" : "Active"}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4 rounded-[1.25rem] border border-white/7 bg-black/15 p-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
            Balance
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {balance.toFixed(4)}
            <span className="ml-1 text-sm text-slate-300">SOL</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
            Transactions
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{totalTx}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
            Approval Rate
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {approvalRate}%
          </div>
        </div>
      </div>

      <div className="mb-5 space-y-3 rounded-[1.25rem] border border-white/7 bg-black/15 p-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-300">
          <span>Policy Envelope</span>
          <span>{policy ? "On-chain" : "Not set"}</span>
        </div>
        {policy ? (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Max / Tx
                </div>
                <div className="mt-1 text-white">
                  {(policy.maxPerTx.toNumber() / 1_000_000_000).toFixed(4)} SOL
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  Daily Cap
                </div>
                <div className="mt-1 text-white">
                  {(policy.maxDaily.toNumber() / 1_000_000_000).toFixed(4)} SOL
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>
                {policy.allowedPrograms.length === 0
                  ? "All programs"
                  : `${policy.allowedPrograms.length} allowlisted`}
              </span>
              <span>{timeWindow}</span>
            </div>
            {utilization !== null && (
              <div>
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  <span>Daily utilization</span>
                  <span>{utilization.toFixed(0)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-300"
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm leading-6 text-slate-300">
            No policy account found. Create or sync the wallet to enable live spending controls.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-300">
          Agent: <span className="font-mono text-slate-300">{shortenAddress(account.agent.toBase58())}</span>
        </div>
        <div className="text-cyan-200 opacity-0 transition-opacity group-hover:opacity-100">
          Manage →
        </div>
      </div>
    </Link>
  );
}
