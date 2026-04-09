"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
  const pathname = usePathname();
  const { wallet, connected, disconnect, select, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const walletLabel = wallet?.adapter.name || "Connect Wallet";

  const openWalletModal = () => {
    setVisible(true);
  };

  const switchWallet = async () => {
    select(null);
    await disconnect();
    setVisible(true);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#08101c]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-[1.01]">
              <Image
                src="/logo.png"
                alt="TavSin"
                width={36}
                height={36}
                className="rounded-xl ring-1 ring-white/10 shadow-[0_0_30px_rgba(56,189,248,0.1)]"
              />
              <div>
                <div className="bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-300 bg-clip-text text-xl font-semibold tracking-[-0.04em] text-transparent">
                  TavSin
                </div>
                <div className="hidden text-[10px] uppercase tracking-[0.28em] text-slate-300 sm:block">
                  Agent Wallet Protocol
                </div>
              </div>
            </Link>
            <div className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1 sm:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ${
                    pathname === link.href
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="tavsin-fade-up tavsin-delay-2 flex flex-col items-end gap-2">
            {connected ? (
              <div className="flex items-center gap-2">
                <div className="hidden rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 sm:block">
                  {walletLabel}
                </div>
                <button
                  type="button"
                  onClick={switchWallet}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8"
                >
                  Switch Wallet
                </button>
                <button
                  type="button"
                  onClick={disconnect}
                  className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                  disabled={connecting}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openWalletModal}
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_20px_70px_rgba(56,189,248,0.22)] transition-transform hover:-translate-y-0.5"
              >
                Connect Wallet
              </button>
            )}
            <div className="max-w-[260px] text-right text-[11px] leading-5 text-slate-400">
              Choose a wallet, then use Switch Wallet anytime if you want a different option.
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
