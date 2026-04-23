import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "../components/SolanaProvider";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
  title: {
    default: "TavSin — The trust layer for the agent economy",
    template: "%s · TavSin",
  },
  description:
    "Policy-enforced smart wallets that let AI agents spend on Solana — within hard, on-chain rules you set. Live on devnet.",
  keywords: [
    "Solana",
    "AI agents",
    "smart wallet",
    "agent payments",
    "x402",
    "MCP",
    "agent economy",
    "on-chain policy",
    "Anchor",
    "TavSin",
  ],
  applicationName: "TavSin",
  authors: [{ name: "TavSin", url: "https://tavsin.xyz" }],
  category: "technology",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://tavsin.xyz",
    siteName: "TavSin",
    title: "TavSin — The trust layer for the agent economy",
    description:
      "Smart wallets with on-chain spending policies for AI agents on Solana. Every denial is logged on-chain.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TavSin — Smart wallets for AI agents on Solana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TavSin — The trust layer for the agent economy",
    description:
      "Smart wallets with on-chain spending policies for AI agents on Solana. Live deny feed at tavsin.xyz/live.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://tavsin.xyz",
  },
  robots: {
    index: true,
    follow: true,
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
          <Footer />
        </SolanaProvider>
      </body>
    </html>
  );
}
