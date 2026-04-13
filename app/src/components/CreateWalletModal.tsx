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

/* ── Policy Templates ────────────────────────────────── */
const JUPITER_V6 = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";
const RAYDIUM_AMM = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

interface PolicyTemplate {
  label: string;
  description: string;
  maxPerTx: string;
  maxDaily: string;
  allowedPrograms: string;
  timeStart: string;
  timeEnd: string;
}

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    label: "Conservative DeFi",
    description: "Low limits, Jupiter + Raydium only, business hours",
    maxPerTx: "0.05",
    maxDaily: "0.5",
    allowedPrograms: [JUPITER_V6, RAYDIUM_AMM].join("\n"),
    timeStart: "9",
    timeEnd: "17",
  },
  {
    label: "MCP Tool Payments",
    description: "Micro-payments for API calls, any program, 24/7",
    maxPerTx: "0.01",
    maxDaily: "0.1",
    allowedPrograms: "",
    timeStart: "",
    timeEnd: "",
  },
  {
    label: "High-Frequency Trading",
    description: "Higher limits, DeFi programs, no time restriction",
    maxPerTx: "1",
    maxDaily: "10",
    allowedPrograms: [JUPITER_V6, RAYDIUM_AMM].join("\n"),
    timeStart: "",
    timeEnd: "",
  },
  {
    label: "Treasury Ops",
    description: "SOL transfers + token ops only, strict budget",
    maxPerTx: "0.5",
    maxDaily: "2",
    allowedPrograms: [SYSTEM_PROGRAM, TOKEN_PROGRAM].join("\n"),
    timeStart: "8",
    timeEnd: "20",
  },
];

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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const applyTemplate = (t: PolicyTemplate) => {
    setMaxPerTx(t.maxPerTx);
    setMaxDaily(t.maxDaily);
    setAllowedPrograms(t.allowedPrograms);
    setTimeStart(t.timeStart);
    setTimeEnd(t.timeEnd);
    setSelectedTemplate(t.label);
  };

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
    setSelectedTemplate(null);
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

          {/* ── Policy Template Picker ── */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Policy Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {POLICY_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selectedTemplate === t.label
                      ? "border-cyan-400/40 bg-cyan-400/10"
                      : "border-white/8 bg-black/20 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-semibold text-white">
                    {t.label}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-tight text-slate-400">
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
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
