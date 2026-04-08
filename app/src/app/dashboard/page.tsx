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
  const { wallets, loading, error, refresh } = useWallets();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (!connected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <Image
          src="/logo.png"
          alt="TavSin"
          width={80}
          height={80}
          className="mb-6 rounded-xl"
        />
        <h2 className="text-2xl font-bold text-white mb-3">
          Connect Your Wallet
        </h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          Connect a Solana wallet to create and manage smart wallets for your AI
          agents.
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage your AI agent smart wallets
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
        >
          + Create Wallet
        </button>
      </div>

      {/* Stats Overview */}
      {wallets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Wallets"
            value={wallets.length.toString()}
          />
          <StatCard
            label="Total Balance"
            value={`${wallets
              .reduce((sum, w) => sum + w.balance, 0)
              .toFixed(4)} SOL`}
          />
          <StatCard
            label="Active"
            value={wallets
              .filter((w) => !w.account.frozen)
              .length.toString()}
          />
          <StatCard
            label="Frozen"
            value={wallets
              .filter((w) => w.account.frozen)
              .length.toString()}
          />
        </div>
      )}

      {/* Wallet List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
          <span className="ml-3 text-gray-400">Loading wallets...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={refresh}
            className="text-sm text-cyan-400 hover:text-cyan-300"
          >
            Try again
          </button>
        </div>
      ) : wallets.length === 0 ? (
        <div className="p-12 rounded-2xl border border-[#1e293b] bg-[#111827]/50 text-center">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No wallets yet
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Create your first smart wallet to start securing AI agent
            transactions with on-chain spending policies.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Create First Wallet
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((w) => (
            <WalletCard key={w.publicKey.toBase58()} wallet={w} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateWalletModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refresh}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#1e293b] bg-[#111827]/50">
      <div className="text-xs text-gray-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}
