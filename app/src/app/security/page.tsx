import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin Security",
  description: "Security posture, audit prep, and operational controls for TavSin.",
};

const supportCards = supportPages.filter((page) => page.href !== "/security");

export default function SecurityPage() {
  return (
    <PageFrame
      badge="Security"
      title="Risk controls are a product feature, not a footnote."
      lead="A protocol that manages autonomous capital needs its security story in public. This page should show the trust model, the operational roles, and what still needs review before broader deployment."
      stats={[
        { label: "Owner control", value: "Freeze-ready" },
        { label: "Audit posture", value: "Prepared" },
        { label: "Read layer", value: "Validated" },
        { label: "Incident model", value: "Named roles" },
      ]}
      sections={[
        {
          eyebrow: "Controls",
          title: "What is enforced by the program",
          body: "The protocol checks transaction size, daily spend, recipient and program allowlists, time windows, and frozen status before a request can become an execution path.",
        },
        {
          eyebrow: "Audit prep",
          title: "Why the review surface matters",
          body: "Security review is not just about code correctness. It is about proving that the public behavior, operational roles, and launch configuration match the trust assumptions the site presents.",
          bullets: [
            "Document the program ID, deployed commit, and binary hash.",
            "Keep owner and emergency roles clearly assigned.",
            "Validate the read layer before scaling the dashboard.",
            "Review any upgrade or release path before mainnet.",
          ],
        },
        {
          eyebrow: "Incident response",
          title: "What happens if something looks wrong",
          body: "The response model should prioritize the freeze authority, log inspection, and rapid communication. If a model or integration behaves badly, the protocol must let the operator stop movement immediately.",
        },
        {
          eyebrow: "Disclosure",
          title: "What users deserve to know",
          body: "Visitors should be able to see whether the protocol is devnet or mainnet, whether an audit is complete, and which operational roles are active. That transparency is part of the security story.",
        },
        {
          eyebrow: "Limitations",
          title: "What still needs verification",
          body: "Before mainnet, security review, deployment discipline, and role assignment need to be finished. The site should not pretend otherwise.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/whitepaper", label: "Protocol Design" }}
      secondaryCta={{ href: "/status", label: "Launch Status" }}
    />
  );
}
