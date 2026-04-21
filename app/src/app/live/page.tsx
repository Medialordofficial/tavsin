"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Connection, PublicKey } from "@solana/web3.js";
import { BorshCoder, EventParser, type Idl } from "@coral-xyz/anchor";

import idlJson from "@/lib/tavsin_idl.json";
import { getPublicProgramId } from "@/lib/program-config";
import { getPublicCluster, getPublicRpcEndpoint } from "@/lib/network";

type DenyEvent = {
  signature: string;
  slot: number;
  receivedAt: number;
  wallet: string;
  requestId: string;
  reason: number;
  amount: string;
};

const REASON_LABELS: Record<number, string> = {
  1: "exceeds per-tx limit",
  2: "exceeds daily budget",
  3: "program not allowed",
  4: "outside time window",
  5: "wallet frozen",
  6: "blocked mint",
  7: "recipient not allowed",
  8: "approval required",
  9: "owner rejected",
  10: "insufficient balance",
  11: "request expired",
  12: "unsupported execution",
};

function reasonLabel(code: number): string {
  return REASON_LABELS[code] ?? `unknown (${code})`;
}

function shortKey(s: string): string {
  return s.length <= 12 ? s : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

function formatLamports(raw: string): string {
  // Heuristic: SOL has 9 decimals; we don't know the asset here so display raw + sol guess.
  try {
    const n = BigInt(raw);
    const sol = Number(n) / 1_000_000_000;
    if (sol > 0 && sol < 1_000_000) {
      return `${sol.toLocaleString(undefined, { maximumFractionDigits: 6 })} (≈ asset)`;
    }
    return raw;
  } catch {
    return raw;
  }
}

function explorerCluster(c: ReturnType<typeof getPublicCluster>): string {
  if (c === "mainnet-beta") return "";
  if (c === "localnet") return "?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899";
  return "?cluster=devnet";
}

function explorerTx(sig: string, c: ReturnType<typeof getPublicCluster>): string {
  return `https://explorer.solana.com/tx/${sig}${explorerCluster(c)}`;
}

function explorerAddress(addr: string, c: ReturnType<typeof getPublicCluster>): string {
  return `https://explorer.solana.com/address/${addr}${explorerCluster(c)}`;
}

export default function LiveDenyFeed() {
  const [events, setEvents] = useState<DenyEvent[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const subRef = useRef<number | null>(null);
  const connRef = useRef<Connection | null>(null);

  const programId = useMemo(() => getPublicProgramId(), []);
  const endpoint = useMemo(() => getPublicRpcEndpoint(), []);
  const cluster = useMemo(() => getPublicCluster(), []);

  useEffect(() => {
    let cancelled = false;
    const connection = new Connection(endpoint, "confirmed");
    connRef.current = connection;

    let parser: EventParser;
    try {
      const coder = new BorshCoder(idlJson as Idl);
      parser = new EventParser(programId, coder);
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
      return;
    }

    try {
      const subId = connection.onLogs(
        new PublicKey(programId),
        (log, ctx) => {
          if (cancelled) return;
          if (log.err) return;
          if (!log.logs?.length) return;

          for (const evt of parser.parseLogs(log.logs)) {
            if (evt.name !== "RequestDenied" && evt.name !== "requestDenied") {
              continue;
            }
            const data = evt.data as {
              wallet: PublicKey;
              requestId: { toString(): string };
              reason: number;
              amount: { toString(): string };
            };
            const next: DenyEvent = {
              signature: log.signature,
              slot: ctx?.slot ?? 0,
              receivedAt: Date.now(),
              wallet: data.wallet.toBase58(),
              requestId: data.requestId.toString(),
              reason: data.reason,
              amount: data.amount.toString(),
            };
            setEvents((prev) => [next, ...prev].slice(0, 50));
          }
        },
        "confirmed"
      );
      subRef.current = subId;
      setStatus("live");
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
    }

    return () => {
      cancelled = true;
      if (subRef.current !== null && connRef.current) {
        connRef.current.removeOnLogsListener(subRef.current).catch(() => {});
      }
    };
  }, [endpoint, programId]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-slate-100">
      <header className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.32em] text-emerald-400">
          Live · {programId.toBase58().slice(0, 4)}…{programId.toBase58().slice(-4)}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Watch attackers fail in real time.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-400">
          Every transaction the TavSin program denies emits a{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200">
            RequestDenied
          </code>{" "}
          event. This page subscribes directly to the program logs and renders
          them as they land — no indexer, no backend, no polling. Just
          web3.js + the on-chain IDL.
        </p>
        <div className="mt-6 flex items-center gap-3 text-sm">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              status === "live"
                ? "animate-pulse bg-emerald-400"
                : status === "error"
                ? "bg-rose-500"
                : "bg-amber-400"
            }`}
          />
          <span className="text-slate-300">
            {status === "live"
              ? `Subscribed to program logs · ${events.length} denial${
                  events.length === 1 ? "" : "s"
                } streamed`
              : status === "error"
              ? `Subscription error: ${errorMsg ?? "unknown"}`
              : "Connecting to RPC…"}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-500">
            <p className="mb-2">Waiting for the next denial.</p>
            <p>
              Submit a request that violates a policy on devnet and it will
              appear here within a slot. See{" "}
              <Link
                href="/dashboard"
                className="text-emerald-400 underline-offset-2 hover:underline"
              >
                the dashboard
              </Link>{" "}
              to set up a wallet.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {events.map((e) => (
              <li
                key={`${e.signature}-${e.requestId}`}
                className="grid gap-4 px-6 py-4 md:grid-cols-[160px_1fr_auto] md:items-center"
              >
                <div>
                  <div className="text-xs uppercase tracking-wider text-rose-400">
                    DENIED · #{e.requestId}
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    {reasonLabel(e.reason)}
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  <div>
                    wallet{" "}
                    <a
                      href={explorerAddress(e.wallet, cluster)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-200 underline-offset-2 hover:text-emerald-400 hover:underline"
                    >
                      <code>{shortKey(e.wallet)}</code>
                    </a>
                  </div>
                  <div>amount {formatLamports(e.amount)}</div>
                </div>
                <div className="flex flex-col items-start gap-1 text-xs text-slate-500 md:items-end">
                  <a
                    href={explorerTx(e.signature, cluster)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    explorer ↗
                  </a>
                  <a
                    href={`https://solscan.io/tx/${e.signature}${cluster === "mainnet-beta" ? "" : `?cluster=${cluster === "localnet" ? "custom" : "devnet"}`}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-emerald-400 hover:underline"
                  >
                    solscan ↗
                  </a>
                  <span>slot {e.slot.toLocaleString()}</span>
                  <span>{new Date(e.receivedAt).toLocaleTimeString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 text-xs text-slate-500">
        This page subscribes via{" "}
        <code className="text-slate-300">connection.onLogs(programId)</code>{" "}
        and decodes events with{" "}
        <code className="text-slate-300">BorshCoder + EventParser</code> from
        the on-chain IDL. The same stream powers indexers, webhooks, and
        anomaly detection.
      </footer>
    </main>
  );
}
