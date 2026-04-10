import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "Contact TavSin",
  description: "Ways to reach the TavSin project and report issues.",
};

const supportCards = supportPages.filter((page) => page.href !== "/contact");

export default function ContactPage() {
  return (
    <PageFrame
      badge="Contact"
      title="A simple contact surface for operators, judges, and contributors."
      lead="The public site should make it easy to reach the project for product questions, security issues, partnership discussions, and launch feedback."
      sections={[
        {
          eyebrow: "Primary channel",
          title: "Start with the open-source repository",
          body: "For bugs, feature requests, and technical questions, the GitHub repository is the clearest public trail. That keeps the project transparent and easy to track.",
        },
        {
          eyebrow: "Direct contact",
          title: "A dedicated inbox for protocol communication",
          body: "Use hello@tavsin.xyz for launch coordination, press, and non-urgent protocol communication. Replace it with your final operational inbox if needed.",
        },
        {
          eyebrow: "Security issues",
          title: "Escalate anything that affects funds or access",
          body: "Problems that affect custody, policy enforcement, deployment integrity, or freeze behavior should go through the security channel first, not the general support path.",
        },
        {
          eyebrow: "Partnerships",
          title: "Talk about integrations and launch use cases",
          body: "If another team wants to use TavSin as the control plane for agent spending, the contact page should route them to the product, technical, and operational owners quickly.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "mailto:hello@tavsin.xyz", label: "Email TavSin", external: true }}
      secondaryCta={{ href: "https://github.com/Medialordofficial/tavsin", label: "GitHub Repo", external: true }}
    />
  );
}
