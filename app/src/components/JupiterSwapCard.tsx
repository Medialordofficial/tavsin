"use client";

import { useCallback, useMemo, useState } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  buildRequestPayloadFromInstruction,
  getAssetTrackerPda,
  getAuditPda,
  getPolicyPda,
  getRequestPda,
  NATIVE_MINT,
  shortenAddress,
} from "@tavsin/sdk";
import { getProgram } from "@/lib/program";
import { getErrorMessage } from "@/lib/errors";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const POPULAR_TOKENS = [
  { symbol: "SOL", mint: SOL_MINT, decimals: 9 },
  { symbol: "USDC", mint: USDC_MINT, decimals: 6 },
  { symbol: "USDT", mint: "Es9vMFrzaCERmKfrHJZ3uYczLambmFZi4xULwfkL8mqR", decimals: 6 },
  { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", decimals: 6 },
  { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", decimals: 5 },
] as const;

interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

interface SwapInstructionsResponse {
  swapInstruction: {
    programId: string;
    accounts: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
    data: string;
  };
  addressLookupTableAddresses: string[];
  computeBudgetInstructions: Array<{
    programId: string;
    accounts: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
    data: string;
  }>;
}

export default function JupiterSwapCard({
  walletAddress,
  walletAccount,
  refresh,
}: {
  walletAddress: string;
  walletAccount: { account: { agent: PublicKey; owner: PublicKey; nextRequestId: BN; nextAuditId: BN } };
  refresh: () => void;
}) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const walletPubkey = useMemo(() => new PublicKey(walletAddress), [walletAddress]);

  const isAgent = Boolean(publicKey?.equals(walletAccount.account.agent));

  const [inputToken, setInputToken] = useState(SOL_MINT);
  const [outputToken, setOutputToken] = useState(USDC_MINT);
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState("100");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  const inputTokenInfo = POPULAR_TOKENS.find((t) => t.mint === inputToken);
  const outputTokenInfo = POPULAR_TOKENS.find((t) => t.mint === outputToken);

  const handleGetQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);

    try {
      const decimals = inputTokenInfo?.decimals ?? 9;
      const rawAmount = Math.floor(parseFloat(amount) * 10 ** decimals);

      const res = await fetch(
        `/api/jupiter/quote?inputMint=${inputToken}&outputMint=${outputToken}&amount=${rawAmount}&slippageBps=${slippageBps}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Quote failed");
      }

      const data: JupiterQuote = await res.json();
      setQuote(data);
    } catch (err: unknown) {
      setQuoteError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setQuoteLoading(false);
    }
  }, [amount, inputToken, outputToken, slippageBps, inputTokenInfo]);

  const handleSubmitSwap = useCallback(async () => {
    if (!anchorWallet || !quote || !isAgent) return;

    setSubmitting(true);
    setTxMessage(null);
    setTxError(null);

    try {
      // Get swap instructions from Jupiter
      const ixRes = await fetch("/api/jupiter/swap-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: walletPubkey.toBase58(),
        }),
      });

      if (!ixRes.ok) {
        const data = await ixRes.json();
        throw new Error(data.error || "Swap instructions failed");
      }

      const ixData: SwapInstructionsResponse = await ixRes.json();

      // Convert to TransactionInstruction
      const swapIx = new TransactionInstruction({
        programId: new PublicKey(ixData.swapInstruction.programId),
        keys: ixData.swapInstruction.accounts.map((acc) => ({
          pubkey: new PublicKey(acc.pubkey),
          isSigner: acc.isSigner,
          isWritable: acc.isWritable,
        })),
        data: Buffer.from(ixData.swapInstruction.data, "base64"),
      });

      // Build governed request payload
      const payload = buildRequestPayloadFromInstruction(swapIx, walletPubkey);

      const program = getProgram(connection, anchorWallet);
      const [requestPda] = getRequestPda(walletPubkey, walletAccount.account.nextRequestId.toNumber());
      const [auditEntryPda] = getAuditPda(walletPubkey, walletAccount.account.nextAuditId.toNumber());
      const [assetTrackerPda] = getAssetTrackerPda(walletPubkey, NATIVE_MINT);

      const inDecimals = inputTokenInfo?.decimals ?? 9;
      const outDecimals = outputTokenInfo?.decimals ?? 6;
      const inSymbol = inputTokenInfo?.symbol ?? shortenAddress(inputToken, 4);
      const outSymbol = outputTokenInfo?.symbol ?? shortenAddress(outputToken, 4);
      const memo = `Jupiter swap: ${(Number(quote.inAmount) / 10 ** inDecimals).toFixed(4)} ${inSymbol} → ${(Number(quote.outAmount) / 10 ** outDecimals).toFixed(2)} ${outSymbol}`;

      await program.methods
        .submitRequest(
          new BN(quote.inAmount),
          memo,
          payload.instructionHash,
          payload.accountsHash,
          null
        )
        .accounts({
          agent: anchorWallet.publicKey,
          wallet: walletPubkey,
          policy: getPolicyPda(walletPubkey)[0],
          request: requestPda,
          auditEntry: auditEntryPda,
          recipient: NATIVE_MINT,
          assetMint: NATIVE_MINT,
          assetTracker: assetTrackerPda,
          targetProgram: swapIx.programId,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setTxMessage(`Swap request submitted! ${memo}`);
      setQuote(null);
      setAmount("");
      refresh();
    } catch (err: unknown) {
      setTxError(getErrorMessage(err, "Swap submission failed"));
    } finally {
      setSubmitting(false);
    }
  }, [
    anchorWallet,
    connection,
    inputToken,
    inputTokenInfo,
    isAgent,
    outputToken,
    outputTokenInfo,
    quote,
    refresh,
    walletAccount,
    walletPubkey,
  ]);

  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Jupiter Governed Swap</div>
        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
          via TavSin
        </div>
      </div>
      <p className="mb-4 text-xs leading-5 text-slate-300">
        Get a real-time Jupiter quote, then submit the swap as a governed request.
        The owner&apos;s policy controls limits, approval, and audit.
      </p>

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-300">
              From
            </label>
            <select
              value={inputToken}
              onChange={(e) => { setInputToken(e.target.value); setQuote(null); }}
              className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            >
              {POPULAR_TOKENS.map((t) => (
                <option key={t.mint} value={t.mint}>{t.symbol}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-slate-300">
              To
            </label>
            <select
              value={outputToken}
              onChange={(e) => { setOutputToken(e.target.value); setQuote(null); }}
              className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
            >
              {POPULAR_TOKENS.filter((t) => t.mint !== inputToken).map((t) => (
                <option key={t.mint} value={t.mint}>{t.symbol}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setQuote(null); }}
            placeholder={`Amount (${inputTokenInfo?.symbol ?? "tokens"})`}
            className="w-full rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <input
            type="number"
            min="1"
            max="5000"
            value={slippageBps}
            onChange={(e) => setSlippageBps(e.target.value)}
            placeholder="Slippage bps"
            className="w-24 rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-center text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <button
          onClick={handleGetQuote}
          disabled={quoteLoading || !amount || parseFloat(amount) <= 0}
          className="w-full rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {quoteLoading ? "Getting Quote..." : "Get Jupiter Quote"}
        </button>

        {quoteError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {quoteError}
          </div>
        )}

        {quote && (
          <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Quote
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">You pay</span>
                <span className="font-medium text-white">
                  {(Number(quote.inAmount) / 10 ** (inputTokenInfo?.decimals ?? 9)).toFixed(4)}{" "}
                  {inputTokenInfo?.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">You receive</span>
                <span className="font-medium text-emerald-200">
                  {(Number(quote.outAmount) / 10 ** (outputTokenInfo?.decimals ?? 6)).toFixed(
                    (outputTokenInfo?.decimals ?? 6) > 2 ? 4 : 2
                  )}{" "}
                  {outputTokenInfo?.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Price impact</span>
                <span className="text-white">{quote.priceImpactPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Slippage</span>
                <span className="text-white">{quote.slippageBps / 100}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Route</span>
                <span className="text-white">
                  {quote.routePlan.map((r) => r.swapInfo.label).join(" → ")}
                </span>
              </div>
            </div>

            {isAgent ? (
              <button
                onClick={handleSubmitSwap}
                disabled={submitting}
                className="mt-4 w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting Swap Request..." : "Submit Governed Swap"}
              </button>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
                Connect as the agent to submit swap requests.
              </div>
            )}
          </div>
        )}

        {txMessage && (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {txMessage}
          </div>
        )}
        {txError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {txError}
          </div>
        )}
      </div>
    </div>
  );
}
