"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supportPages } from "@/lib/site-links";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

const features = [
  {
    eyebrow: "POLICY RAILS",
    title: "Spending Policies",
    desc: "Per-transaction ceilings, rolling budgets, allowlists, and time windows enforced directly by the program.",
  },
  {
    eyebrow: "AGENT OPS",
    title: "Agent Autonomy",
    desc: "Agents move capital inside hard constraints instead of waiting for manual approvals or multisig babysitting.",
  },
  {
    eyebrow: "RISK CONTROL",
    title: "Kill Switch",
    desc: "Freeze a wallet instantly when model behavior, market conditions, or integrations stop looking safe.",
  },
  {
    eyebrow: "VERIFIABILITY",
    title: "On-Chain Audit Trail",
    desc: "Every approval and every denial is logged on-chain so operators can inspect real behavior, not promises.",
  },
  {
    eyebrow: "EXECUTION",
    title: "Solana Speed",
    desc: "Sub-second rule checks keep agent execution fast enough for real on-chain workflows and payment loops.",
  },
  {
    eyebrow: "LIVE GOVERNANCE",
    title: "Live Policy Updates",
    desc: "Adjust limits and permissions in production without replacing wallets or redeploying core infrastructure.",
  },
];

const competitors = [
  {
    name: "MCPay",
    won: "1st Place Stablecoins, Cypherpunk",
    does: "x402 payments for MCP tools",
    gap: "No spending governance — agents spend uncapped",
  },
  {
    name: "Latinum",
    won: "1st Place AI, Breakout",
    does: "Agent payment middleware",
    gap: "Budget management delegated to application code",
  },
  {
    name: "Blowfish",
    won: "",
    does: "Scam detection & risk warnings",
    gap: "Passive warnings to humans — not active enforcement for agents",
  },
  {
    name: "Turnkey",
    won: "",
    does: "Wallet infrastructure for agents",
    gap: "Key management only — no transaction-level policy",
  },
  {
    name: "Squads",
    won: "",
    does: "Human multisig wallets",
    gap: "Designed for human committees, not autonomous agents",
  },
];

const protocolStats = [
  { label: "On-chain instructions", value: "17" },
  { label: "Policy checks per tx", value: "7" },
  { label: "Tests passing", value: "28/28" },
  { label: "Events emitted", value: "14" },
  { label: "Devnet deploy", value: "Live" },
  { label: "Audit trail", value: "100%" },
];

const rails = [
  "Wallet-owned PDA custody",
  "7 on-chain policy checks",
  "Deterministic audit entries",
  "Instant owner freeze control",
];

const operatingModel = [
  {
    index: "01",
    title: "Capital sits in protocol-controlled wallets",
    desc: "Funds do not live in the agent. TavSin holds custody in a PDA wallet derived from owner and agent identity.",
  },
  {
    index: "02",
    title: "The agent requests execution, not custody",
    desc: "The model can initiate spend requests, but the protocol enforces amount, budget, time, program, and freeze status.",
  },
  {
    index: "03",
    title: "Every decision becomes visible state",
    desc: "Approved and denied transactions are logged as protocol records, turning agent behavior into auditable infrastructure.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_12%,rgba(245,158,11,0.16),transparent_22%),linear-gradient(180deg,rgba(10,15,30,0.92),rgba(10,15,30,1))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        <div className="absolute left-0 right-0 top-24 h-[420px] tavsin-grid-mask" />
        <div className="tavsin-drift absolute -left-24 top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="tavsin-drift absolute right-[-4rem] top-36 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl [animation-delay:1.8s]" />
      </div>

      <div className="relative border-b border-white/8 bg-white/[0.02]">
        <div className="overflow-hidden py-3">
          <div className="tavsin-marquee-track flex w-[200%] items-center gap-8 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-300">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <div key={groupIndex} className="flex items-center gap-8">
                {[
                  "Policy enforced wallet custody",
                  "Agent spend limits",
                  "On-chain audit records",
                  "Freeze and recovery controls",
                  "Solana devnet live",
                ].map((item) => (
                  <span key={`${groupIndex}-${item}`} className="flex items-center gap-8">
                    <span className="text-cyan-200">{item}</span>
                    <span className="h-1 w-1 rounded-full bg-amber-300/80" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="pointer-events-none absolute inset-x-4 top-8 hidden h-[360px] lg:block">
          <div className="absolute left-[6%] top-12 h-px w-[34%] tavsin-rail-flow opacity-80" />
          <div className="absolute left-[12%] top-24 h-px w-[26%] tavsin-rail-flow opacity-60 [animation-delay:1.6s]" />
          <div className="absolute right-[8%] top-10 h-40 w-40 rounded-full border border-cyan-400/14">
            <div className="tavsin-orbit absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_28px_rgba(56,189,248,0.8)]" />
          </div>
          <div className="tavsin-float absolute right-[18%] top-28 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.26)]">
            Live policy rails
          </div>
          <div className="tavsin-float absolute right-[8%] top-48 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100 shadow-[0_16px_50px_rgba(56,189,248,0.12)] [animation-delay:1.1s]">
            Agent capital under control
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="tavsin-fade-up">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200 shadow-[0_0_40px_rgba(56,189,248,0.08)]">
              TavSin Protocol
              <span className="h-1 w-1 rounded-full bg-cyan-300" />
              Autonomous finance control layer
            </div>

            <div className="mb-8 flex items-center gap-5">
              <Image
                src="/logo.png"
                alt="TavSin"
                width={88}
                height={88}
                priority
                className="tavsin-fade-scale rounded-2xl ring-1 ring-white/10 shadow-[0_0_60px_rgba(56,189,248,0.12)]"
              />
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-300">
                  Solana Devnet Live · MCP Compatible
                </div>
                <div className="mt-2 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  The trust layer for the agent economy
                </div>
              </div>
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.05em] text-white sm:text-7xl lg:text-[5.5rem] tavsin-fade-scale">
              AI agents move money.
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-300 bg-clip-text text-transparent">
                We make that safe.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              TavSin is a policy-enforced smart wallet for autonomous AI agents on
              Solana. Spending limits, vendor allowlists, and daily budgets are
              enforced <span className="text-cyan-200">on-chain</span> — agents
              can&rsquo;t bypass them. Every transaction emits a tamper-proof
              audit entry. Plugs into Claude Desktop, Cursor, and any MCP client.
              The regulatory unlock for enterprises deploying agent fleets.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
              <Link
                href="/dashboard"
                className="tavsin-shimmer inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400 to-sky-500 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_20px_70px_rgba(56,189,248,0.22)] transition-transform hover:-translate-y-0.5"
              >
                Launch App
              </Link>
              <Link
                href="/live"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200 shadow-[0_20px_70px_rgba(16,185,129,0.16)] transition-transform hover:-translate-y-0.5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live Deny Feed
              </Link>
              <a
                href="https://explorer.solana.com/address/2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8"
              >
                Inspect Program
              </a>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
              {rails.map((item) => (
                <div
                  key={item}
                  className="tavsin-fade-up flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-200 backdrop-blur-sm"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300 shadow-[0_0_18px_rgba(56,189,248,0.8)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative tavsin-fade-scale">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-cyan-400/10 via-transparent to-amber-300/10 blur-2xl tavsin-glow-pulse" />
            <div className="tavsin-scanline relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(11,17,32,0.98))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="mb-5 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
                  <span>Protocol signal mesh</span>
                  <span className="text-cyan-200">Monitoring live rails</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                      <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.9)]" />
                      Treasury rail scan
                    </div>
                    <div className="space-y-3">
                      {[
                        ["Policy engine", "97% integrity"],
                        ["Execution band", "2.1s response"],
                        ["Audit relay", "Immutable sync"],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.03] px-3 py-2 text-sm">
                          <span className="text-slate-200">{label}</span>
                          <span className="text-cyan-100">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/14 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_50%),rgba(255,255,255,0.03)] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-200">
                      Autonomous command loop
                    </div>
                    <div className="relative mt-4 flex h-32 items-center justify-center">
                      <div className="absolute h-24 w-24 rounded-full border border-white/10" />
                      <div className="absolute h-16 w-16 rounded-full border border-cyan-400/20" />
                      <div className="tavsin-orbit absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
                      <div className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white">
                        TavSin core
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-slate-300">
                    Capital Control Surface
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    Wallet Security Stack
                  </div>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Live
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Program Status", "Deployed"],
                  ["Settlement Rail", "Solana"],
                  ["Policy Engine", "5 checks"],
                  ["Audit Mode", "On-chain"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4 transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                      {label}
                    </div>
                    <div className="mt-3 text-lg font-semibold text-white">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_34%),rgba(255,255,255,0.025)] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                      Core thesis
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      Agents should execute, not custody.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                      Auditability
                    </div>
                    <div className="mt-2 text-lg font-semibold text-cyan-300">
                      100%
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    ["Per-tx limit", "Hard capped in policy account"],
                    ["Daily budget", "Tracked by rolling spend account"],
                    ["Program access", "Allowlisted at execution time"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-white/7 bg-black/20 px-4 py-3 text-sm transition-colors hover:border-cyan-300/20"
                    >
                      <span className="text-slate-200">{label}</span>
                      <span className="font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    Launch access
                  </div>
                  <div className="text-xs text-slate-300">Connect on devnet</div>
                </div>
                <WalletMultiButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MCP / Claude Desktop live demo strip */}
      <section className="border-t border-white/8 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                Live LLM Demo
              </div>
              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Plug into Claude Desktop.
                <span className="block bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">
                  Watch policy enforce in real time.
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                TavSin ships as an MCP server with 7 tools. Connect it to Claude,
                Cursor, or any MCP client. Ask the LLM to spend USDC. Watch the
                program approve small payments, deny oversized ones, and hit the
                daily budget — every decision logged on devnet.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="https://github.com/Medialordofficial/tavsin/blob/main/mcp/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100 transition-colors hover:bg-cyan-400/15"
                >
                  MCP Setup Guide
                </a>
                <a
                  href="https://github.com/Medialordofficial/tavsin/tree/main/examples/demo-agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8"
                >
                  Run USDC Demo
                </a>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(8,12,24,0.99))] p-6 font-mono text-[13px] leading-7 shadow-[0_30px_120px_rgba(0,0,0,0.4)]">
              <div className="mb-4 flex items-center gap-2 border-b border-white/8 pb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
                Claude Desktop · TavSin MCP · devnet
              </div>
              <div className="space-y-2.5">
                <div><span className="text-slate-500">user&gt;</span> <span className="text-slate-200">pay merchant X 25 USDC</span></div>
                <div><span className="text-emerald-300">tavsin.submit_request</span> <span className="text-emerald-200">→ ✓ approved · executed</span></div>
                <div className="text-slate-600">─────────────────────────────</div>
                <div><span className="text-slate-500">user&gt;</span> <span className="text-slate-200">pay 75 USDC</span></div>
                <div><span className="text-rose-300">tavsin.submit_request</span> <span className="text-rose-200">→ ✗ denied: exceeds per-tx limit (50 USDC)</span></div>
                <div className="text-slate-600">─────────────────────────────</div>
                <div><span className="text-slate-500">user&gt;</span> <span className="text-slate-200">pay 40 USDC, five times</span></div>
                <div><span className="text-emerald-200">→ ✓ ✓ ✓</span> <span className="text-rose-200">→ ✗ daily budget hit (200 USDC)</span></div>
                <div className="text-slate-600">─────────────────────────────</div>
                <div><span className="text-slate-500">user&gt;</span> <span className="text-slate-200">show audit log</span></div>
                <div><span className="text-cyan-300">tavsin.get_audit_log</span> <span className="text-cyan-200">→ 8 entries · all on-chain</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Protocol Model
              </div>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Designed like infrastructure, not marketing theatre.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
              The best crypto protocol homepages feel like they are exposing an
              operating model. TavSin should do the same: clear system design,
              visible risk posture, and credible execution language.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {operatingModel.map((item) => (
              <div
                key={item.index}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20"
              >
                <div className="mb-5 text-5xl font-semibold tracking-[-0.06em] text-white/12">
                  {item.index}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="leading-7 text-slate-200">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Control Modules
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Every wallet behaves like a programmable mandate.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              Instead of selling abstract “AI safety”, TavSin defines concrete
              financial controls at the wallet layer. That is what makes the
              product feel credible in a crypto context.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20"
              >
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300 transition-colors group-hover:text-cyan-200">
                  {f.eyebrow}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-7 text-slate-200">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.16),transparent_26%),linear-gradient(180deg,rgba(17,24,39,0.92),rgba(8,12,24,0.98))] p-8 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                  Start Here
                </div>
                <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  Build agent finance with the visual language of a serious protocol.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  TavSin is not another AI wrapper. It is wallet infrastructure
                  for teams that need autonomous execution without surrendering
                  financial control.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition-colors hover:bg-slate-100"
                >
                  Launch Dashboard
                </Link>
                <a
                  href="https://github.com/Medialordofficial/tavsin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/6"
                >
                  View Source
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Squads for Agents — one-liner callout */}
      <section className="border-t border-white/8 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="tavsin-fade-up rounded-[2rem] border border-cyan-400/20 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.18),transparent_40%),linear-gradient(180deg,rgba(17,24,39,0.95),rgba(8,12,24,0.99))] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-12">
            <div className="mx-auto max-w-3xl">
              <div className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                The Missing Layer
              </div>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">Squads</span> is for human multisig.{" "}
                <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">TavSin</span> is for autonomous agents.
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-300 sm:text-lg">
                Squads protects against bad humans. TavSin protects against bad inference.
                Different threat model, different primitives — agent identity, MCP-native tooling,
                shared blocklist registry, on-chain reputation graph.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                325+ Solana AI projects. Thousands of MCP tool servers. x402 standardizing agent payments.
                Zero projects built the wallet governance layer — until now.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor landscape */}
      <section className="border-t border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Competitive Landscape
            </div>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Everyone built the rails. Nobody built the controls.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              We studied every project in the Solana AI agent stack.
              Payment rails exist. Wallet governance does not. TavSin fills the gap.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {competitors.map((c) => (
              <div
                key={c.name}
                className="group relative rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-red-400/20"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{c.name}</h3>
                  {c.won && (
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                      {c.won}
                    </span>
                  )}
                </div>
                <p className="mb-3 text-sm leading-6 text-slate-300">{c.does}</p>
                <div className="rounded-xl border border-red-400/15 bg-red-400/5 px-3 py-2 text-sm text-red-200">
                  {c.gap}
                </div>
              </div>
            ))}
            <div className="group rounded-[1.75rem] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/30">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-cyan-200">TavSin</h3>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  This project
                </span>
              </div>
              <p className="mb-3 text-sm leading-6 text-slate-300">Policy-enforced smart wallet for AI agents</p>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200">
                On-chain policy checks, approval workflows, audit trail, fleet dashboard
              </div>
            </div>
          </div>

          {/* Head-to-head feature matrix */}
          <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
            <div className="border-b border-white/8 bg-white/[0.02] px-6 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Head-to-head
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                Why TavSin is the only on-chain governance layer for agents
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Capability</th>
                    <th className="px-5 py-3 font-semibold">MCPay</th>
                    <th className="px-5 py-3 font-semibold">Latinum</th>
                    <th className="px-5 py-3 font-semibold">Squads</th>
                    <th className="px-5 py-3 font-semibold">Turnkey</th>
                    <th className="px-5 py-3 font-semibold text-cyan-200">TavSin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {[
                    ["Built for autonomous AI agents", "✓", "✓", "✗", "✓", "✓"],
                    ["On-chain spend limits (per-tx + daily)", "✗", "✗", "✗", "✗", "✓"],
                    ["Per-recipient counterparty rules", "✗", "✗", "✗", "✗", "✓"],
                    ["Time-window restrictions enforced on-chain", "✗", "✗", "✗", "✗", "✓"],
                    ["Program allowlist (CPI gating)", "✗", "✗", "—", "✗", "✓"],
                    ["Tamper-proof on-chain audit trail", "✗", "✗", "✓", "✗", "✓"],
                    ["Instant kill switch / freeze", "✗", "✗", "✓", "—", "✓"],
                    ["Emergency panic-drain", "✗", "✗", "—", "✗", "✓"],
                    ["MCP-native tool surface", "✓", "—", "✗", "✗", "✓"],
                    ["DAO / multisig as owner (Squads + Realms)", "✗", "✗", "n/a", "✗", "✓"],
                    ["Token-2022 transfer-hook composable", "✗", "✗", "✗", "✗", "✓"],
                  ].map(([cap, ...cells]) => (
                    <tr key={cap} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-slate-100">{cap}</td>
                      {cells.map((v, i) => {
                        const isTavsin = i === cells.length - 1;
                        const isYes = v === "✓";
                        const isNo = v === "✗";
                        return (
                          <td
                            key={i}
                            className={`px-5 py-3 text-center font-mono text-sm ${
                              isTavsin && isYes
                                ? "bg-emerald-400/10 text-emerald-300 font-semibold"
                                : isYes
                                  ? "text-emerald-300/80"
                                  : isNo
                                    ? "text-rose-400/70"
                                    : "text-slate-500"
                            }`}
                          >
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/5 bg-black/20 px-5 py-3 text-[11px] uppercase tracking-[0.16em] text-slate-500">
              ✓ available · ✗ not available · — partial / out of scope
            </div>
          </div>
        </div>
      </section>

      {/* Protocol evidence strip */}
      <section className="border-t border-white/8 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Protocol Evidence
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Not a demo. A real protocol.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {protocolStats.map((s) => (
              <div
                key={s.label}
                className="tavsin-fade-up rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/20"
              >
                <div className="text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Protocol Library
              </div>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                The missing pages now exist.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
              About, White Paper, Docs, Team, Roadmap, FAQ, Security, Contact, Status, Terms, and Privacy are now available as first-class routes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supportPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/20"
              >
                <div className="text-lg font-semibold text-white group-hover:text-cyan-200">
                  {page.label}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-200">
                  {page.description}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(8,12,24,0.1),rgba(8,12,24,0.98))] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.14),transparent_22%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(10,15,30,0.99))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.38)] sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  TavSin Protocol
                  <span className="h-1 w-1 rounded-full bg-cyan-300" />
                  Devnet live
                </div>
                <div className="flex items-center gap-3">
                  <Image src="/logo.png" alt="TavSin" width={40} height={40} className="rounded-xl ring-1 ring-white/10" />
                  <div>
                    <div className="text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">
                      TavSin for autonomous finance
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-slate-100">
                      Policy-enforced smart wallets for AI agents, built to look and behave like serious crypto infrastructure.
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    ["Policy rails", "Amount, budget, time, and program rules"],
                    ["Audit trail", "On-chain approvals and denials"],
                    ["Kill switch", "Owner freeze control in one action"],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-2xl border border-white/12 bg-white/[0.05] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-100">
                        {title}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-100">
                        {text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300">
                    Product
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-100">
                    <Link href="/dashboard" className="block transition-colors hover:text-white">
                      Dashboard
                    </Link>
                    <Link href="/" className="block transition-colors hover:text-white">
                      Landing
                    </Link>
                    <a
                      href="https://explorer.solana.com/address/2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy?cluster=devnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-colors hover:text-white"
                    >
                      Program Explorer
                    </a>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">
                    Network
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-100">
                    <a
                      href="https://github.com/Medialordofficial/tavsin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block transition-colors hover:text-white"
                    >
                      GitHub
                    </a>
                    <span className="block">Solana Devnet</span>
                    <span className="block">Wallet adapter enabled</span>
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-white/12 bg-white/[0.05] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.2)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-100">
                        Status
                      </div>
                      <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">
                        Live wallet protocol on Solana
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                      Operational
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100">
                    <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-2">PDA custody</span>
                    <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-2">Policy checks</span>
                    <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-2">On-chain audit</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/8 pt-6">
              <div className="flex flex-col gap-3 text-sm text-slate-100 sm:flex-row sm:items-center sm:justify-between">
                <div>© 2026 TavSin Protocol</div>
                <div className="flex flex-wrap gap-4">
                  <span>Built for autonomous finance</span>
                  <span>Policy-enforced custody</span>
                  <span>Solana devnet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
