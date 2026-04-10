"use client";

import { useState } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getWalletPda,
  getPolicyPda,
  getLegacyTrackerPda,
} from "@tavsin/sdk";
import { getProgram } from "@/lib/program";
import { getErrorMessage } from "@/lib/errors";

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
      const [trackerPda] = getLegacyTrackerPda(walletPda);

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
    } catch (err: unknown) {
      console.error("Create wallet error:", err);
      setError(getErrorMessage(err, "Transaction failed"));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
      <div className="tavsin-fade-up w-full max-w-lg rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(8,12,24,0.98))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-200">
              Wallet Creation
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
            Create Smart Wallet
            </h2>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-2xl leading-none text-slate-300 transition-colors hover:text-white"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Agent Public Key *
            </label>
            <input
              type="text"
              required
              value={agentKey}
              onChange={(e) => setAgentKey(e.target.value)}
              placeholder="Enter agent's Solana address"
              className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Max Per Transaction (SOL)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={maxPerTx}
                onChange={(e) => setMaxPerTx(e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Max Daily Budget (SOL)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                required
                value={maxDaily}
                onChange={(e) => setMaxDaily(e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Allowed Programs{" "}
              <span className="text-slate-300">(one per line, leave empty for all)</span>
            </label>
            <textarea
              value={allowedPrograms}
              onChange={(e) => setAllowedPrograms(e.target.value)}
              rows={3}
              placeholder="11111111111111111111111111111111"
              className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Time Window Start{" "}
                <span className="text-slate-300">(hour UTC)</span>
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                placeholder="e.g. 9"
                className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Time Window End{" "}
                <span className="text-slate-300">(hour UTC)</span>
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                placeholder="e.g. 17"
                className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !agentKey}
            className="w-full rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400 to-sky-500 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Wallet"}
          </button>
        </form>
      </div>
    </div>
  );
}
