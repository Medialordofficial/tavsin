import Link from "next/link";
import type { Metadata } from "next";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import {
  fetchAuditEntriesPage,
  type AuditEntryData,
  type PolicyAccountData,
  type SmartWalletAccountData,
} from "@tavsin/sdk";
import { getReadConnection, getReadonlyProgram, getServerHealthContext } from "@/lib/server-program";
import { getPolicyPda } from "@tavsin/sdk";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "TavSin — Live demo (zero clicks)",
  description:
    "A live, server-rendered snapshot of an active TavSin smart wallet on Solana devnet. No wallet, no signup. Judge the protocol in 30 seconds.",
};

const REASON_LABELS: Record<number, string> = {
  0: "—",
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

const OUTCOME_LABELS: Record<number, string> = {
  0: "submitted",
  1: "approved",
  2: "rejected",
  3: "denied",
  4: "executed",
  5: "frozen",
  6: "panic-drain",
};

function shortKey(s: string, chars = 4): string {
  return s.length <= chars * 2 + 1 ? s : `${s.slice(0, chars)}…${s.slice(-chars)}`;
}

function lamportsToSolDisplay(raw: bigint | number): string {
  const sol = Number(raw) / LAMPORTS_PER_SOL;
  if (sol === 0) return "0";
  if (Math.abs(sol) < 0.0001) return sol.toExponential(2);
  return sol.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

type FeaturedSnapshot = {
  walletPubkey: string;
  wallet: SmartWalletAccountData;
  policy: PolicyAccountData | null;
  audit: AuditEntryData[];
  balanceSol: number;
};

async function loadSnapshot(): Promise<{
  ctx: ReturnType<typeof getServerHealthContext>;
  slot: number | null;
  wallets: number;
  audits: number;
  featured: FeaturedSnapshot | null;
  error: string | null;
}> {
  const ctx = getServerHealthContext();
  const program = getReadonlyProgram();
  const connection = getReadConnection();

  try {
    const accounts = program.account as Record<string, { all?: () => Promise<unknown[]> }>;

    const [slot, walletList, auditList] = await Promise.all([
      connection.getSlot("confirmed").catch(() => null),
      accounts.smartWallet?.all?.().catch(() => []) ?? Promise.resolve([]),
      accounts.auditEntry?.all?.().catch(() => []) ?? Promise.resolve([]),
    ]);

    const wallets = (walletList as Array<{
      publicKey: { toBase58(): string };
      account: SmartWalletAccountData;
    }>);

    // Pick the wallet with the highest nextAuditId — i.e. the most active one.
    let featured: FeaturedSnapshot | null = null;
    let bestActivity = -1;
    let bestEntry: { publicKey: { toBase58(): string }; account: SmartWalletAccountData } | null = null;
    for (const w of wallets) {
      const activity = Number(w.account.nextAuditId?.toString?.() ?? 0);
      if (activity > bestActivity) {
        bestActivity = activity;
        bestEntry = w;
      }
    }

    if (bestEntry) {
      const walletPubkey = bestEntry.publicKey;
      const [policyPda] = getPolicyPda(walletPubkey as never);
      const policy = await (program.account as Record<string, { fetch: (pk: unknown) => Promise<PolicyAccountData> }>)
        .policy.fetch(policyPda)
        .catch(() => null);
      const balanceLamports = await connection.getBalance(walletPubkey as never).catch(() => 0);
      const auditPage = await fetchAuditEntriesPage(program, walletPubkey as never, 0, 8).catch(() => ({
        items: [] as AuditEntryData[],
      }));

      featured = {
        walletPubkey: walletPubkey.toBase58(),
        wallet: bestEntry.account,
        policy,
        audit: auditPage.items,
        balanceSol: balanceLamports / LAMPORTS_PER_SOL,
      };
    }

    return {
      ctx,
      slot,
      wallets: wallets.length,
      audits: (auditList as unknown[]).length,
      featured,
      error: null,
    };
  } catch (err) {
    return {
      ctx,
      slot: null,
      wallets: 0,
      audits: 0,
      featured: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function explorerSuffix(cluster: string): string {
  if (cluster === "mainnet-beta") return "";
  return "?cluster=devnet";
}

export default async function DemoPage() {
  const snap = await loadSnapshot();
  const explorer = explorerSuffix(snap.ctx.cluster);

  return (
    <div className="min-h-screen bg-[#040608] text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        {/* Hero */}
        <div className="flex flex-col items-start gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Zero-click demo · Solana {snap.ctx.cluster}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Real on-chain wallet. Real policy. Real audit trail.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            This page is server-rendered from the live TavSin program on Solana
            devnet. No wallet connect, no signup, no theatre. Refresh anytime —
            the snapshot updates with whatever the program has on-chain right
            now.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/30 transition hover:bg-emerald-400/25"
            >
              Watch the live deny feed →
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              Open the operator dashboard
            </Link>
            <a
              href={`https://explorer.solana.com/address/${snap.ctx.programId}${explorer}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-white/25"
            >
              View program on Explorer ↗
            </a>
          </div>
        </div>

        {/* Network strip */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Cluster" value={snap.ctx.cluster} />
          <Stat label="Slot" value={snap.slot ? snap.slot.toLocaleString() : "—"} />
          <Stat label="Smart wallets" value={snap.wallets.toLocaleString()} />
          <Stat label="Audit entries" value={snap.audits.toLocaleString()} />
        </div>
        <div className="mt-3 break-all rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 font-mono text-xs text-slate-400">
          program: {snap.ctx.programId}
        </div>

        {snap.error && (
          <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-5 py-4 text-sm text-amber-200">
            RPC degraded — {snap.error}. The page will recover on refresh.
          </div>
        )}

        {/* Featured wallet */}
        {snap.featured ? (
          <FeaturedWallet snapshot={snap.featured} explorer={explorer} />
        ) : (
          <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-10 text-center text-slate-400">
            No wallets seeded yet.{" "}
            <Link className="text-emerald-300 underline" href="/wallet">
              Create the first one →
            </Link>
          </div>
        )}

        {/* Run-it-yourself */}
        <div className="mt-12 rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-7">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Run the jailbreak demo locally
          </div>
          <div className="mt-1 text-xl font-semibold text-white">
            Four prompt-injection attacks, all denied on-chain
          </div>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/60 px-4 py-4 font-mono text-xs leading-6 text-slate-200">
{`git clone https://github.com/Medialordofficial/tavsin
cd tavsin/examples/demo-agent
npm install
npm run demo:jailbreak`}
          </pre>
          <p className="mt-3 text-sm text-slate-400">
            Tile this terminal next to{" "}
            <Link href="/live" className="text-emerald-300 underline">
              tavsin.xyz/live
            </Link>{" "}
            and watch every denial stream into the feed in real time.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate font-mono text-sm text-white">{value}</div>
    </div>
  );
}

function FeaturedWallet({
  snapshot,
  explorer,
}: {
  snapshot: FeaturedSnapshot;
  explorer: string;
}) {
  const { walletPubkey, wallet, policy, audit, balanceSol } = snapshot;
  const totalApproved = Number(wallet.totalApproved?.toString?.() ?? 0);
  const totalDenied = Number(wallet.totalDenied?.toString?.() ?? 0);
  const totalPending = Number(wallet.totalPending?.toString?.() ?? 0);
  const denials = audit.filter((e) => !e.approved);
  const approvals = audit.filter((e) => e.approved);

  return (
    <section className="mt-10 overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02]">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 bg-gradient-to-r from-white/[0.04] to-transparent px-6 py-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
            Featured wallet · auto-selected by activity
          </div>
          <div className="mt-1 font-mono text-sm text-white">{shortKey(walletPubkey, 8)}</div>
          <a
            href={`https://explorer.solana.com/address/${walletPubkey}${explorer}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex text-xs text-slate-400 underline-offset-2 hover:text-emerald-300 hover:underline"
          >
            view on Solana Explorer ↗
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <KV label="Balance" value={`${balanceSol.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`} />
          <KV label="Approved" value={totalApproved.toLocaleString()} />
          <KV label="Denied" value={totalDenied.toLocaleString()} highlight={totalDenied > 0} />
          <KV label="Pending" value={totalPending.toLocaleString()} />
        </div>
      </header>

      <div className="grid gap-px bg-white/5 lg:grid-cols-5">
        {/* Policy */}
        <div className="bg-[#06080b] p-6 lg:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Active policy (on-chain)
          </div>
          {policy ? (
            <dl className="mt-4 space-y-3 text-sm">
              <Row k="Per-tx ceiling" v={`${lamportsToSolDisplay(BigInt(policy.maxPerTx?.toString?.() ?? "0"))} SOL`} />
              <Row k="Daily budget" v={`${lamportsToSolDisplay(BigInt(policy.maxDaily?.toString?.() ?? "0"))} SOL`} />
              <Row
                k="Approval threshold"
                v={
                  policy.approvalThreshold
                    ? `${lamportsToSolDisplay(BigInt(policy.approvalThreshold.toString()))} SOL`
                    : "none"
                }
              />
              <Row k="Allowed programs" v={String(policy.allowedPrograms?.length ?? 0)} />
              <Row k="Allowed recipients" v={String(policy.allowedRecipients?.length ?? 0)} />
              <Row k="Blocked mints" v={String(policy.blockedMints?.length ?? 0)} />
              <Row
                k="Time window"
                v={
                  policy.timeWindowStart != null && policy.timeWindowEnd != null
                    ? `${policy.timeWindowStart.toString()}s – ${policy.timeWindowEnd.toString()}s UTC`
                    : "24/7"
                }
              />
              <Row k="Frozen" v={wallet.frozen ? "yes" : "no"} highlight={wallet.frozen} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No policy attached.</p>
          )}
        </div>

        {/* Audit trail */}
        <div className="bg-[#06080b] p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Recent audit entries
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {approvals.length} approved · {denials.length} denied
            </div>
          </div>
          {audit.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No on-chain activity yet for this wallet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-white/5 text-sm">
              {audit.map((entry, i) => (
                <li
                  key={`${entry.requestId?.toString?.() ?? i}-${i}`}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          entry.approved
                            ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30"
                            : "bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/30"
                        }`}
                      >
                        {entry.approved ? "approved" : "denied"}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {OUTCOME_LABELS[entry.outcome] ?? `outcome ${entry.outcome}`}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-400">
                      → {shortKey(entry.recipient.toBase58())} · req#
                      {entry.requestId?.toString?.() ?? "?"}
                    </div>
                    {entry.memo && (
                      <div className="mt-1 truncate text-xs text-slate-300">
                        “{entry.memo}”
                      </div>
                    )}
                    {!entry.approved && entry.denialReason !== 0 && (
                      <div className="mt-1 text-xs text-rose-300/90">
                        reason: {REASON_LABELS[entry.denialReason] ?? `code ${entry.denialReason}`}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right font-mono text-xs text-slate-300">
                    {lamportsToSolDisplay(BigInt(entry.amount?.toString?.() ?? "0"))} SOL
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{k}</dt>
      <dd className={`font-mono text-sm ${highlight ? "text-rose-300" : "text-white"}`}>{v}</dd>
    </div>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className={`font-mono text-sm ${highlight ? "text-rose-300" : "text-white"}`}>{value}</div>
    </div>
  );
}
