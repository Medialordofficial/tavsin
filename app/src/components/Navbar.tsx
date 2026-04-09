"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";

export default function Navbar() {
  const pathname = usePathname();
  const { wallet, wallets, connected, disconnect, select, connect, connecting } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const walletLabel = wallet?.adapter.name || "Connect Wallet";

  const orderedWallets = useMemo(
    () =>
      [...wallets].sort((left, right) => {
        const priority = (state: WalletReadyState) =>
          state === WalletReadyState.Installed ? 0 : state === WalletReadyState.Loadable ? 1 : state === WalletReadyState.NotDetected ? 2 : 3;

        return priority(left.readyState) - priority(right.readyState);
      }),
    [wallets]
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleWalletSelect = async (walletName: string) => {
    try {
      if (wallet?.adapter.name === walletName && connected) {
        setMenuOpen(false);
        return;
      }

      await disconnect();
      select(null);
      select(walletName as any);
      await connect();
      setMenuOpen(false);
    } catch {
      setMenuOpen(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      select(null);
    } finally {
      setMenuOpen(false);
    }
  };

  const walletStateLabel = wallet
    ? wallet.readyState === WalletReadyState.Installed
      ? "Installed"
      : wallet.readyState === WalletReadyState.Loadable
      ? "Loadable"
      : wallet.readyState === WalletReadyState.NotDetected
      ? "Not detected"
      : "Unsupported"
    : "No wallet";

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
          <div ref={menuRef} className="tavsin-fade-up tavsin-delay-2 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex min-w-[240px] items-center justify-between gap-4 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 shadow-[0_20px_70px_rgba(56,189,248,0.22)] transition-transform hover:-translate-y-0.5"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex flex-col gap-1 normal-case tracking-normal">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                  {connected ? "Connected wallet" : "Select wallet"}
                </span>
                <span className="text-sm font-semibold text-slate-950">{walletLabel}</span>
              </span>
              <span className="text-lg leading-none text-slate-950">{menuOpen ? "−" : "+"}</span>
            </button>

            {menuOpen && (
              <div className="w-[320px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,12,24,0.98))] p-2 shadow-[0_30px_120px_rgba(0,0,0,0.42)]">
                <div className="px-3 pt-2 pb-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                    Wallet selector
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    Pick a wallet, switch to another, or disconnect the current session.
                  </div>
                </div>

                <div className="max-h-[280px] space-y-2 overflow-y-auto px-1 pb-2">
                  {orderedWallets.map((entry) => {
                    const isCurrent = wallet?.adapter.name === entry.adapter.name;
                    const ready = entry.readyState;
                    const statusLabel =
                      ready === WalletReadyState.Installed
                        ? "Installed"
                        : ready === WalletReadyState.Loadable
                        ? "Loadable"
                        : ready === WalletReadyState.NotDetected
                        ? "Not detected"
                        : "Unsupported";
                    const disabled = ready === WalletReadyState.Unsupported || ready === WalletReadyState.NotDetected;

                    return (
                      <button
                        key={entry.adapter.name}
                        type="button"
                        disabled={disabled || connecting}
                        onClick={() => handleWalletSelect(entry.adapter.name)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
                          isCurrent
                            ? "border-cyan-300/30 bg-cyan-400/10"
                            : "border-white/8 bg-white/[0.03] hover:border-white/16 hover:bg-white/[0.06]"
                        } ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
                      >
                        <img
                          src={entry.adapter.icon}
                          alt=""
                          className="h-9 w-9 rounded-xl bg-white/90 object-cover p-1"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-white">
                            {entry.adapter.name}
                          </div>
                          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                            {isCurrent ? "Current" : statusLabel}
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          {isCurrent ? "Active" : "Select"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 grid gap-2 border-t border-white/8 px-2 pt-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={!connected || connecting}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 transition-transform hover:-translate-y-0.5"
                  >
                    Done
                  </button>
                </div>

                <div className="px-3 pt-3 pb-2 text-[11px] leading-5 text-slate-400">
                  Connected: {walletStateLabel}. You can switch anytime from this menu.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
