"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Connection, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { getPublicCluster, getPublicRpcEndpoint } from "@/lib/network";
import { getPublicProgramId } from "@/lib/program-config";
import { getProgram } from "@/lib/program";

type Status =
  | { kind: "loading" }
  | { kind: "ready"; request: RequestSummary }
  | { kind: "error"; message: string }
  | { kind: "submitting"; action: "approve" | "reject" }
  | { kind: "done"; action: "approve" | "reject"; signature: string };

type RequestSummary = {
  pubkey: PublicKey;
  wallet: PublicKey;
  owner: PublicKey;
  agent: PublicKey;
  requestId: bigint;
  amount: bigint;
  status: number;
  expiresAt: bigint;
};

const STATUS_LABEL: Record<number, string> = {
  0: "Pending",
  1: "Approved",
  2: "Executed",
  3: "Rejected",
  4: "Denied",
  5: "Expired",
  6: "Closed",
};

function shortKey(k: PublicKey | string, len = 4): string {
  const s = typeof k === "string" ? k : k.toBase58();
  return s.length <= len * 2 + 1 ? s : `${s.slice(0, len)}…${s.slice(-len)}`;
}

function explorerCluster(c: ReturnType<typeof getPublicCluster>): string {
  if (c === "mainnet-beta") return "";
  if (c === "localnet")
    return "?cluster=custom&customUrl=http%3A%2F%2F127.0.0.1%3A8899";
  return "?cluster=devnet";
}

export default function ApproveRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const anchorWallet = useAnchorWallet();
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  const cluster = useMemo(() => getPublicCluster(), []);
  const endpoint = useMemo(() => getPublicRpcEndpoint(), []);
  const programId = useMemo(() => getPublicProgramId(), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const requestPubkey = new PublicKey(id);
        const connection = new Connection(endpoint, "confirmed");
        const info = await connection.getAccountInfo(requestPubkey);
        if (cancelled) return;
        if (!info) {
          setStatus({
            kind: "error",
            message: "Request not found on-chain. It may have been closed already.",
          });
          return;
        }
        // Read-only fetch via a placeholder wallet shim if no wallet is connected.
        const program = getProgram(
          connection,
          anchorWallet ?? {
            publicKey: PublicKey.default,
            signTransaction: async (tx) => tx,
            signAllTransactions: async (txs) => txs,
          }
        );
        const accounts = program.account as Record<
          string,
          { fetch: (key: PublicKey) => Promise<unknown> } | undefined
        >;
        const ns = accounts["executionRequest"];
        if (!ns) {
          setStatus({
            kind: "error",
            message: "IDL does not include executionRequest account.",
          });
          return;
        }
        const acc = await ns.fetch(requestPubkey);
        const a = acc as unknown as {
          wallet: PublicKey;
          owner: PublicKey;
          agent: PublicKey;
          requestId: BN;
          amount: BN;
          status: number;
          expiresAt: BN;
        };
        setStatus({
          kind: "ready",
          request: {
            pubkey: requestPubkey,
            wallet: a.wallet,
            owner: a.owner,
            agent: a.agent,
            requestId: BigInt(a.requestId.toString()),
            amount: BigInt(a.amount.toString()),
            status: a.status,
            expiresAt: BigInt(a.expiresAt.toString()),
          },
        });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load request.";
        setStatus({ kind: "error", message });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, endpoint, anchorWallet]);

  async function act(action: "approve" | "reject") {
    if (status.kind !== "ready") return;
    if (!anchorWallet) {
      setStatus({
        kind: "error",
        message: "Connect your owner wallet first.",
      });
      return;
    }
    setStatus({ kind: "submitting", action });
    try {
      const connection = new Connection(endpoint, "confirmed");
      const program = getProgram(connection, anchorWallet);
      const method =
        action === "approve"
          ? program.methods["approveRequest"]!()
          : program.methods["rejectRequest"]!();
      const sig = await method
        .accounts({
          owner: anchorWallet.publicKey,
          wallet: status.request.wallet,
          request: status.request.pubkey,
        })
        .rpc({ commitment: "confirmed" });
      setStatus({ kind: "done", action, signature: sig });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed.";
      setStatus({ kind: "error", message });
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-400 hover:text-emerald-400">
          ← TavSin
        </Link>
        <span className="text-xs uppercase tracking-wider text-slate-500">
          {cluster}
        </span>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <h1 className="text-xl font-semibold text-slate-100">
          Approve request
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Review and decide. This page is mobile-optimized so you can sign from
          your phone.
        </p>

        <div className="mt-5 space-y-3 text-sm">
          <Field label="Request">
            <code className="text-slate-200">{shortKey(id, 6)}</code>
          </Field>

          {status.kind === "loading" && (
            <p className="text-slate-400">Loading request…</p>
          )}

          {status.kind === "error" && (
            <p className="rounded-md border border-rose-900/50 bg-rose-950/40 p-3 text-rose-300">
              {status.message}
            </p>
          )}

          {(status.kind === "ready" ||
            status.kind === "submitting" ||
            status.kind === "done") &&
            "request" in (status as { request?: RequestSummary }) && (
              <RequestDetails request={(status as { request: RequestSummary }).request} />
            )}
        </div>

        {status.kind === "ready" && status.request.status === 0 && (
          <>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => act("approve")}
                disabled={!anchorWallet}
                className="h-14 rounded-xl bg-emerald-500 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400"
              >
                ✓ Approve
              </button>
              <button
                type="button"
                onClick={() => act("reject")}
                disabled={!anchorWallet}
                className="h-14 rounded-xl border border-rose-700/60 bg-rose-950/30 text-base font-semibold text-rose-300 transition hover:bg-rose-900/40 disabled:opacity-50"
              >
                ✕ Reject
              </button>
            </div>
            {!anchorWallet && (
              <div className="mt-4 flex justify-center">
                <WalletMultiButton />
              </div>
            )}
          </>
        )}

        {status.kind === "ready" && status.request.status !== 0 && (
          <p className="mt-5 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-slate-400">
            This request is no longer pending. Current status:{" "}
            <strong className="text-slate-200">
              {STATUS_LABEL[status.request.status] ?? `unknown (${status.request.status})`}
            </strong>
            .
          </p>
        )}

        {status.kind === "submitting" && (
          <p className="mt-5 text-emerald-400">
            Sending {status.action === "approve" ? "approval" : "rejection"}…
          </p>
        )}

        {status.kind === "done" && (
          <div className="mt-5 rounded-md border border-emerald-700/40 bg-emerald-950/40 p-3 text-sm text-emerald-200">
            <p className="font-medium">
              {status.action === "approve" ? "Approved." : "Rejected."}
            </p>
            <a
              href={`https://explorer.solana.com/tx/${status.signature}${explorerCluster(cluster)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all underline"
            >
              {status.signature}
            </a>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-600">
        Program {shortKey(programId.toBase58(), 4)} · {cluster}
      </p>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/60 pb-2">
      <span className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-right text-slate-200">{children}</span>
    </div>
  );
}

function RequestDetails({ request }: { request: RequestSummary }) {
  return (
    <>
      <Field label="Wallet">
        <code className="text-slate-200">{shortKey(request.wallet, 4)}</code>
      </Field>
      <Field label="Owner">
        <code className="text-slate-200">{shortKey(request.owner, 4)}</code>
      </Field>
      <Field label="Agent">
        <code className="text-slate-200">{shortKey(request.agent, 4)}</code>
      </Field>
      <Field label="Amount">
        <span className="text-slate-200">
          {(Number(request.amount) / 1_000_000_000).toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}{" "}
          ≈ asset
        </span>
      </Field>
      <Field label="Status">
        <span className="text-slate-200">
          {STATUS_LABEL[request.status] ?? `unknown (${request.status})`}
        </span>
      </Field>
      <Field label="Expires">
        <span className="text-slate-200">
          {request.expiresAt > BigInt(0)
            ? new Date(Number(request.expiresAt) * 1000).toLocaleString()
            : "never"}
        </span>
      </Field>
    </>
  );
}
