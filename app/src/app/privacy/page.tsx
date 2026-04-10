import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin Privacy",
  description: "Privacy policy for TavSin's website and protocol surface.",
};

const supportCards = supportPages.filter((page) => page.href !== "/privacy");

export default function PrivacyPage() {
  return (
    <PageFrame
      badge="Privacy"
      title="Privacy should be clear even when the protocol is public."
      lead="The site may collect minimal operational data to keep wallet, dashboard, and launch experiences working. On-chain protocol activity remains public by design."
      sections={[
        {
          title: "What the site may collect",
          body: "Basic analytics, page usage, wallet connection state, and browser metadata may be used to keep the experience functioning and to diagnose issues.",
        },
        {
          title: "What the protocol records",
          body: "Execution requests, approvals, denials, and related on-chain state are public or discoverable on the network because that is part of the protocol model.",
        },
        {
          title: "What we do not want",
          body: "The project should avoid unnecessary data retention, hidden tracking, or selling user behavior. If additional tracking is ever added, the site should disclose it clearly.",
        },
        {
          title: "Third-party services",
          body: "Wallet adapters, RPC providers, GitHub, and the Solana explorer are third-party services. Their own privacy terms apply when users interact with them.",
        },
        {
          title: "Retention",
          body: "Operational logs should be kept only as long as needed for security, debugging, or launch operations, unless a longer retention period is required by law.",
        },
        {
          title: "Your choices",
          body: "Users can decide whether to connect a wallet, whether to continue using the dashboard, and whether to interact with the protocol on-chain.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/terms", label: "Terms" }}
      secondaryCta={{ href: "/contact", label: "Contact" }}
    />
  );
}
