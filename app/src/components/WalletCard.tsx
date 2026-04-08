"use client";

import Link from "next/link";
import { WalletAccount, shortenAddress } from "./WalletCardHelpers";

interface WalletCardProps {
  wallet: WalletAccount;
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const { publicKey, account, balance } = wallet;
  const totalTx =
    account.totalApproved.toNumber() + account.totalDenied.toNumber();
  const approvalRate =
    totalTx > 0
      ? Math.round(
          (account.totalApproved.toNumber() / totalTx) * 100
        )
      : 100;

  return (
    <Link
      href={`/wallet/${publicKey.toBase58()}`}
      className="group block overflow-hidden rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20 hover:shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
    >
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="mb-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Wallet PDA
          </div>
          <div className="font-mono text-sm text-white">
            {shortenAddress(publicKey.toBase58(), 6)}
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            account.frozen
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {account.frozen ? "Frozen" : "Active"}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4 rounded-[1.25rem] border border-white/7 bg-black/15 p-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Balance
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {balance.toFixed(4)}
            <span className="ml-1 text-sm text-slate-400">SOL</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Transactions
          </div>
          <div className="mt-2 text-lg font-semibold text-white">{totalTx}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Approval Rate
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {approvalRate}%
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-400">
          Agent:{" "}
          <span className="font-mono text-slate-300">
            {shortenAddress(account.agent.toBase58())}
          </span>
        </div>
        <div className="text-cyan-300 opacity-0 transition-opacity group-hover:opacity-100">
          Manage →
        </div>
      </div>
    </Link>
  );
}
