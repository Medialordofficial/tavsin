import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin Roadmap",
  description: "Launch and product roadmap for TavSin.",
};

const supportCards = supportPages.filter((page) => page.href !== "/roadmap");

export default function RoadmapPage() {
  return (
    <PageFrame
      badge="Roadmap"
      title="From devnet launch to a protocol that can carry real capital."
      lead="The roadmap should show what is already working, what still needs verification, and what has to be true before mainnet capital is considered safe enough for broader use."
      stats={[
        { label: "Current phase", value: "Launch hardening" },
        { label: "Next milestone", value: "Security review" },
        { label: "Network posture", value: "Devnet live" },
        { label: "Mainnet gate", value: "Operational readiness" },
      ]}
      sections={[
        {
          eyebrow: "Now",
          title: "Finish launch readiness",
          body: "The near-term work is documentation, operational role assignment, security review prep, and making sure the public pages tell the truth about what is live and what is pending.",
        },
        {
          eyebrow: "Next",
          title: "Mainnet enablement",
          body: "Mainnet should only happen after deployment config, read validation, and security feedback are settled. That means the public surface is aligned with the operational reality.",
        },
        {
          eyebrow: "Product",
          title: "Expand the support surface",
          body: "The site should add deeper docs, stronger onboarding, and clearer audit and status pages so the product feels like a platform, not a one-off demo.",
        },
        {
          eyebrow: "Ecosystem",
          title: "Integrations and usage",
          body: "The long-term roadmap is to make TavSin the wallet governance layer for agents, payment workflows, and treasury automation across the Solana AI stack.",
        },
        {
          eyebrow: "Governance",
          title: "Keep control explicit",
          body: "Role assignment, release approvals, and incident response should stay visible as the system grows so that scale does not erase accountability.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/status", label: "Check Status" }}
      secondaryCta={{ href: "/security", label: "Security First" }}
    />
  );
}
