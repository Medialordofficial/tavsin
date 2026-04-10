import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin Terms",
  description: "Draft terms for using the TavSin site and protocol.",
};

const supportCards = supportPages.filter((page) => page.href !== "/terms");

export default function TermsPage() {
  return (
    <PageFrame
      badge="Terms"
      title="Draft terms for the TavSin site and protocol surface."
      lead="These terms are intentionally plain-language. They should be reviewed before any mainnet launch or public commercial use."
      sections={[
        {
          title: "Acceptance",
          body: "By using the site or interacting with the public protocol surface, you agree to follow applicable law, avoid abuse, and accept that the software is provided on an as-is basis unless a separate agreement says otherwise.",
        },
        {
          title: "Risk",
          body: "On-chain software carries technical, economic, and operational risk. TavSin does not guarantee that policies, integrations, or wallets will behave exactly as any user expects in every environment.",
        },
        {
          title: "Availability",
          body: "The site, dashboard, APIs, and protocol interfaces may change, pause, or be withdrawn as part of maintenance, security work, or launch operations.",
        },
        {
          title: "Intellectual property",
          body: "Unless otherwise stated, the TavSin name, logo, documentation, and site assets remain the property of the project or their respective owners.",
        },
        {
          title: "No warranties",
          body: "To the maximum extent permitted by law, the project disclaims warranties of merchantability, fitness for a particular purpose, and non-infringement.",
        },
        {
          title: "Changes",
          body: "The project may update these terms as the protocol matures. If the changes are material, the public site should reflect that clearly.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/privacy", label: "Privacy Policy" }}
      secondaryCta={{ href: "/contact", label: "Contact" }}
    />
  );
}
