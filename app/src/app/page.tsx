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
    icon: "🛡️",
    title: "Spending Policies",
    desc: "Set per-transaction limits, daily budgets, program allowlists, and time windows — all enforced on-chain.",
  },
  {
    icon: "🤖",
    title: "Agent Autonomy",
    desc: "AI agents transact freely within your rules. No human approval needed for compliant transactions.",
  },
  {
    icon: "🔐",
    title: "Kill Switch",
    desc: "Instantly freeze any wallet with one click. Your agents stop spending immediately.",
  },
  {
    icon: "📊",
    title: "On-Chain Audit Trail",
    desc: "Every transaction — approved or denied — is logged on Solana. Full transparency, zero trust required.",
  },
  {
    icon: "⚡",
    title: "Solana Speed",
    desc: "Sub-second policy checks. Agents don't wait. Powered by Solana's 400ms block times.",
  },
  {
    icon: "🔧",
    title: "Live Policy Updates",
    desc: "Change limits, allowlists, and time windows in real-time. No redeployment needed.",
  },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/logo-tagline.png"
                alt="TavSin"
                width={200}
                height={200}
                priority
              />
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                Smart Wallets
              </span>
              <br />
              <span className="text-white">for AI Agents</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Give your AI agents the ability to spend on-chain — within rules
              you define. Per-tx limits, daily budgets, program allowlists, and
              a kill switch. All enforced by Solana smart contracts.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              >
                Launch App
              </Link>
              <a
                href="https://github.com/Medialordofficial/tavsin"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border border-[#1e293b] text-gray-300 font-semibold text-lg hover:bg-[#1e293b]/50 transition-all"
              >
                View Code ↗
              </a>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-8 sm:gap-16">
              {[
                ["Program", "Live on Devnet"],
                ["Policy Checks", "5 On-Chain Rules"],
                ["Audit Trail", "100% Transparent"],
                ["Architecture", "PDA Smart Wallet"],
              ].map(([label, value]) => (
                <div key={label} className="text-center">
                  <div className="text-sm text-gray-500 uppercase tracking-wider">
                    {label}
                  </div>
                  <div className="text-lg font-semibold text-white mt-1">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-[#1e293b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            Three steps to give your AI agent safe, autonomous spending power.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create a Smart Wallet",
                desc: "Define your agent's public key and set spending policies — limits, budgets, allowed programs, time windows.",
              },
              {
                step: "02",
                title: "Fund the Wallet",
                desc: "Deposit SOL into the wallet PDA. Only you (the owner) can fund or withdraw. The agent can't touch the deposit.",
              },
              {
                step: "03",
                title: "Agent Transacts Autonomously",
                desc: "Your agent calls execute — the program checks all 5 policy rules. If compliant, the PDA sends funds. If not, it logs a denial.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl border border-[#1e293b] bg-[#111827]/50 hover:border-cyan-500/30 transition-colors"
              >
                <div className="text-5xl font-bold text-cyan-500/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-[#1e293b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Built for the Agent Economy
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-[#1e293b] bg-[#111827]/50 hover:border-cyan-500/20 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#1e293b]">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Image
            src="/logo.png"
            alt="TavSin"
            width={64}
            height={64}
            className="mx-auto mb-6 rounded-xl"
          />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to deploy your first smart wallet?
          </h2>
          <p className="text-gray-400 mb-8">
            Connect your Solana wallet and create a policy-enforced wallet for
            your AI agent in under a minute.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
          >
            Launch Dashboard →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e293b] py-8">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="TavSin" width={24} height={24} />
            <span className="text-sm text-gray-500">
              © 2026 TavSin Protocol
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a
              href="https://github.com/Medialordofficial/tavsin"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://explorer.solana.com/address/2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Explorer
            </a>
            <span>Solana Devnet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
