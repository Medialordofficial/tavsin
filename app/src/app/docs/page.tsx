import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin Docs",
  description: "Documentation hub for TavSin's product, technical, and launch pages.",
};

export default function DocsPage() {
  const docsCards = supportPages.filter((page) => page.href !== "/docs");

  return (
    <PageFrame
      badge="Documentation"
      title="Everything the protocol should explain, in one place."
      lead="Use this hub to move from the public pitch into the support surface: product story, technical paper, launch status, team, roadmap, FAQ, security, contact, and legal pages."
      sections={[
        {
          eyebrow: "Start here",
          title: "A clean entry point for the rest of the site",
          body: "The homepage should win attention; this page should win clarity. It gives judges, operators, and future users a direct path to the content they expect from a serious protocol site.",
        },
      ]}
      cards={docsCards}
      primaryCta={{ href: "/about", label: "About TavSin" }}
      secondaryCta={{ href: "/whitepaper", label: "Read White Paper" }}
    />
  );
}
