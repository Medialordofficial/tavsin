"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getProgram,
  getWalletPda,
  getPolicyPda,
  getTrackerPda,
} from "@/lib/program";

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWalletModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWalletModalProps) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [agentKey, setAgentKey] = useState("");
  const [maxPerTx, setMaxPerTx] = useState("0.1");
  const [maxDaily, setMaxDaily] = useState("1");
  const [allowedPrograms, setAllowedPrograms] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    try {
      setSubmitting(true);
      setError(null);

      const program = getProgram(connection, wallet);
      const agentPubkey = new PublicKey(agentKey.trim());

      const maxPerTxLamports = new BN(
        Math.floor(parseFloat(maxPerTx) * LAMPORTS_PER_SOL)
      );
      const maxDailyLamports = new BN(
        Math.floor(parseFloat(maxDaily) * LAMPORTS_PER_SOL)
      );

      const programs = allowedPrograms
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => new PublicKey(s));

      const twStart = timeStart ? new BN(parseInt(timeStart) * 3600) : null;
      const twEnd = timeEnd ? new BN(parseInt(timeEnd) * 3600) : null;

      const [walletPda] = getWalletPda(wallet.publicKey, agentPubkey);
      const [policyPda] = getPolicyPda(walletPda);
      const [trackerPda] = getTrackerPda(walletPda);

      await program.methods
        .createWallet(
          maxPerTxLamports,
          maxDailyLamports,
          programs,
          twStart,
          twEnd
        )
        .accounts({
          owner: wallet.publicKey,
          agent: agentPubkey,
          wallet: walletPda,
          policy: policyPda,
          tracker: trackerPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error("Create wallet error:", err);
      setError(err.message || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAgentKey("");
    setMaxPerTx("0.1");
    setMaxDaily("1");
    setAllowedPrograms("");
    setTimeStart("");
    setTimeEnd("");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-[#111827] border border-[#1e293b] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Create Smart Wallet
          </h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Agent Public Key *
            </label>
            <input
              type="text"
              required
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              placeholder="Enter agent's Solana address"
              className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Per Transaction (SOL)
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Max Daily Budget (SOL)
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
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Allowed Programs{" "}
              <span className="text-gray-500">(one per line, leave empty for all)</span>
            </label>
            <textarea
              value={allowedPrograms}
              onChange={(e) => setAllowedPrograms(e.target.value)}
              rows={3}
              placeholder="11111111111111111111111111111111"
              className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Time Window Start{" "}
                <span className="text-gray-500">(hour UTC)</span>
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                placeholder="e.g. 9"
                className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Time Window End{" "}
                <span className="text-gray-500">(hour UTC)</span>
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                placeholder="e.g. 17"
                className="w-full px-3 py-2 bg-[#0a0f1e] border border-[#1e293b] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
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
            disabled={submitting || !agentKey}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create Wallet"}
          </button>
        </form>
      </div>
    </div>
  );
}
