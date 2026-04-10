import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin FAQ",
  description: "Frequently asked questions about TavSin.",
};

const supportCards = supportPages.filter((page) => page.href !== "/faq");

export default function FaqPage() {
  return (
    <PageFrame
      badge="FAQ"
      title="The answers people usually ask before they trust the rails."
      lead="If a visitor is deciding whether TavSin is real infrastructure or just a concept, the FAQ should remove the obvious uncertainty fast."
      sections={[
        {
          title: "Is TavSin custodial?",
          body: "No. The point of the protocol is to keep custody in wallet state governed by policy, not in the agent itself.",
        },
        {
          title: "What stops an agent from overspending?",
          body: "The program enforces per-transaction limits, rolling budgets, program allowlists, time windows, and freeze status before execution is allowed.",
        },
        {
          title: "Is this live on mainnet?",
          body: "The public site is devnet live and the mainnet path should remain gated by the launch checklist and security review.",
        },
        {
          title: "How is this different from multisig?",
          body: "Multisig is built for human committees. TavSin is built for autonomous agents that still need a policy layer and an audit trail.",
        },
        {
          title: "Where do I read the technical details?",
          body: "Start with the white paper and then check the status, security, and docs pages for launch context.",
        },
        {
          title: "What should judges or partners look for?",
          body: "Look for visible risk controls, clear launch status, and a product surface that explains both the protocol and the operating model.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/whitepaper", label: "Read White Paper" }}
      secondaryCta={{ href: "/contact", label: "Contact" }}
    />
  );
}
