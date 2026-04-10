import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin Team",
  description: "Core contributors, roles, and accountability model behind TavSin.",
};

const supportCards = supportPages.filter((page) => page.href !== "/team");

export default function TeamPage() {
  return (
    <PageFrame
      badge="Team"
      title="Small team, high accountability, direct ownership."
      lead="TavSin should not look like a faceless experiment. The project is operated by a tight group of builders who care about protocol engineering, product clarity, and deployment discipline."
      stats={[
        { label: "Operating style", value: "Hands-on" },
        { label: "Delivery model", value: "Small and focused" },
        { label: "Accountability", value: "Explicit roles" },
        { label: "Surface area", value: "Protocol + product" },
      ]}
      sections={[
        {
          eyebrow: "Contributors",
          title: "Who should be listed here",
          body: "The public site should identify the builder, the operator, and the security owner once the final launch roles are confirmed. Until then, the page documents the role structure rather than inventing names.",
        },
        {
          eyebrow: "Roles",
          title: "The operating model",
          body: "Protocol engineering handles the smart-wallet logic, product design handles the operator experience, and launch operations handle key rotation, release discipline, and incident response.",
          bullets: [
            "Protocol engineering: policy checks, account modeling, read layer, and SDK maintenance.",
            "Product and UX: landing page, dashboard flows, and launch narrative.",
            "Operations: deployment control, freeze authority, and incident handling.",
          ],
        },
        {
          eyebrow: "Open source",
          title: "How collaboration should work",
          body: "A protocol this visible needs readable code, clear docs, and direct ownership. Public pages should make it obvious where issues go, how the release cycle works, and which parts are audited before wider rollout.",
        },
        {
          eyebrow: "Accountability",
          title: "Why this page matters",
          body: "A serious protocol does not hide its operators. It makes the people and roles behind control visible enough that users can understand who is responsible for risk.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/contact", label: "Contact the Project" }}
      secondaryCta={{ href: "/security", label: "Review Security" }}
    />
  );
}
