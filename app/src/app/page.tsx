"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

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

const rails = [
  "Wallet-owned PDA custody",
  "5 on-chain policy checks",
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
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300 shadow-[0_0_40px_rgba(56,189,248,0.08)]">
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
                className="rounded-2xl ring-1 ring-white/10 shadow-[0_0_60px_rgba(56,189,248,0.12)]"
              />
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Solana Devnet Live
                </div>
                <div className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                  The operating system for agent wallets
                </div>
              </div>
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.05em] text-white sm:text-7xl lg:text-[5.5rem]">
              Risk rails for
              <span className="block bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-300 bg-clip-text text-transparent">
                autonomous capital
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              TavSin gives AI agents controlled on-chain spending without giving
              them uncontrolled custody. Think protocol-grade wallet
              infrastructure, not a generic AI landing page. Capital stays in a
              policy-enforced smart wallet. Agents operate inside explicit risk
              limits. Owners keep override power.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-gradient-to-r from-cyan-400 to-sky-500 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_20px_70px_rgba(56,189,248,0.22)] transition-transform hover:-translate-y-0.5"
              >
                Enter Protocol App
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
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-slate-300 backdrop-blur-sm"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300 shadow-[0_0_18px_rgba(56,189,248,0.8)]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-cyan-400/10 via-transparent to-amber-300/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(11,17,32,0.98))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="mb-5 flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
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
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
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
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      Core thesis
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      Agents should execute, not custody.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
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
                      className="flex items-center justify-between rounded-xl border border-white/7 bg-black/20 px-4 py-3 text-sm"
                    >
                      <span className="text-slate-400">{label}</span>
                      <span className="font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-black/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Launch access
                  </div>
                  <div className="text-xs text-slate-500">Connect on devnet</div>
                </div>
                <WalletMultiButton />
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
            <p className="max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              The best crypto protocol homepages feel like they are exposing an
              operating model. TavSin should do the same: clear system design,
              visible risk posture, and credible execution language.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {operatingModel.map((item) => (
              <div
                key={item.index}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-6 transition-colors hover:border-cyan-300/20"
              >
                <div className="mb-5 text-5xl font-semibold tracking-[-0.06em] text-white/10">
                  {item.index}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="leading-7 text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                Control Modules
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Every wallet behaves like a programmable mandate.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Instead of selling abstract “AI safety”, TavSin defines concrete
              financial controls at the wallet layer. That is what makes the
              product feel credible in a crypto context.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 transition-all hover:-translate-y-1 hover:border-cyan-300/20"
              >
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 transition-colors group-hover:text-cyan-300">
                  {f.eyebrow}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-7 text-slate-400">{f.desc}</p>
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

      <footer className="border-t border-white/8 bg-[linear-gradient(180deg,rgba(8,12,24,0.2),rgba(8,12,24,0.96))] py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_85%_15%,rgba(245,158,11,0.1),transparent_22%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(8,12,24,0.99))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.34)] sm:p-8 lg:p-10">
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
                    <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">
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
                    <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                        {title}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-400">
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
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
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
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
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

                <div className="sm:col-span-2 rounded-2xl border border-white/8 bg-black/18 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
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
                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">PDA custody</span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">Policy checks</span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">On-chain audit</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/8 pt-6">
              <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
