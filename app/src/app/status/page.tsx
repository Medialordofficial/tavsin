import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin Status",
  description: "Deployment status, network posture, and launch readiness for TavSin.",
};

const supportCards = supportPages.filter((page) => page.href !== "/status");

export default function StatusPage() {
  return (
    <PageFrame
      badge="Status"
      title="What is live right now, and what is still waiting on launch gates?"
      lead="This page should remove ambiguity between devnet and mainnet. It is the public state of the protocol, not a marketing claim."
      stats={[
        { label: "Public network", value: "Devnet" },
        { label: "Dashboard", value: "Live" },
        { label: "Read layer", value: "Validated" },
        { label: "Mainnet", value: "Pending" },
      ]}
      sections={[
        {
          eyebrow: "Live now",
          title: "What visitors can use today",
          body: "The landing page, dashboard, API surface, and protocol explorer links are live. The app is intended to show the operating model and support the hackathon and launch process.",
        },
        {
          eyebrow: "Launch gates",
          title: "What still needs to be true before mainnet",
          body: "The deployment configuration, security review, operational role assignment, and read validation need to be complete before broader mainnet usage is appropriate.",
          bullets: [
            "Review and freeze the operational role assignments.",
            "Complete the security review and address any findings.",
            "Keep the public site aligned with the actual network state.",
          ],
        },
        {
          eyebrow: "Network posture",
          title: "Devnet versus mainnet",
          body: "Devnet is the public proving ground. Mainnet should only be announced once the team is prepared to support real capital with the same controls the site claims.",
        },
        {
          eyebrow: "Operational clarity",
          title: "Who should monitor status",
          body: "The release owner, incident commander, and freeze authority should be able to tell users what changed, what is safe, and what is still in review.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/dashboard", label: "Open Dashboard" }}
      secondaryCta={{ href: "/security", label: "Security" }}
    />
  );
}
