"use client";

import Link from "next/link";
import { WalletAccount, lamportsToSol, shortenAddress } from "./WalletCardHelpers";

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
      className="block p-6 rounded-2xl border border-[#1e293b] bg-[#111827]/50 hover:border-cyan-500/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Wallet PDA</div>
          <div className="font-mono text-sm text-white">
            {shortenAddress(publicKey.toBase58(), 6)}
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            account.frozen
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {account.frozen ? "Frozen" : "Active"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Balance
          </div>
          <div className="text-lg font-semibold text-white mt-1">
            {balance.toFixed(4)}
            <span className="text-sm text-gray-400 ml-1">SOL</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Transactions
          </div>
          <div className="text-lg font-semibold text-white mt-1">{totalTx}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            Approval Rate
          </div>
          <div className="text-lg font-semibold text-white mt-1">
            {approvalRate}%
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-400">
          Agent:{" "}
          <span className="font-mono text-gray-300">
            {shortenAddress(account.agent.toBase58())}
          </span>
        </div>
        <div className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Manage →
        </div>
      </div>
    </Link>
  );
}
