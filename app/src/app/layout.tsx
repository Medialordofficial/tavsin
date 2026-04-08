import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "../components/SolanaProvider";
import Navbar from "../components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tavsin.xyz"),
  title: "TavSin — Smart Wallet for AI Agents",
  description:
    "Policy-enforced smart wallets that let AI agents spend on-chain — within rules you set. Built on Solana.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "TavSin — The Trust Layer for Autonomous Finance",
    description:
      "Smart wallets with spending policies for AI agents on Solana.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SolanaProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </SolanaProvider>
      </body>
    </html>
  );
}
