import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin — Team",
  description:
    "The builders behind TavSin: protocol engineering, product, and security ownership.",
};

const supportCards = supportPages.filter((page) => page.href !== "/team");

export default function TeamPage() {
  return (
    <PageFrame
      badge="Team"
      title="A small team building the trust layer for autonomous finance."
      lead="TavSin is built by a tight group focused on protocol engineering, product clarity, and security discipline. Public, accountable, reachable."
      stats={[
        { label: "Founders", value: "Full-time" },
        { label: "Discipline", value: "Protocol + product" },
        { label: "Cadence", value: "Ship weekly" },
        { label: "Origin", value: "Solana Colosseum 2026" },
      ]}
      sections={[
        {
          eyebrow: "Founder",
          title: "Emmanuel Mfon — Founder, Protocol Engineering",
          body: "Designs and ships the on-chain program: policy engine, custody PDAs, request/audit lifecycle, and SDK. Sole maintainer of the Anchor program and the TypeScript client. All code is public on GitHub; the contact page lists how to reach the project directly.",
          bullets: [
            "Owns: programs/tavsin — 17 instructions, 14 events, 28 tests passing on Anchor 1.0.",
            "Owns: @tavsin/sdk and the Next.js dashboard, live deny feed, and mobile approve UX.",
            "Owns: deployment authority on devnet and the upcoming mainnet rollout.",
          ],
        },
        {
          eyebrow: "Operating model",
          title: "Why a small team is the right team to ship this",
          body: "TavSin is an intentionally narrow primitive: a policy-enforced smart wallet, plus the SDK and product surfaces a developer needs to adopt it. A focused team can ship the entire vertical — program, SDK, dashboard, examples — without coordination tax. We add specialists only after mainnet.",
          bullets: [
            "Protocol: hand-rolled Anchor program, no fork, no template.",
            "Product: live dashboard, real-time deny feed, mobile approve flow — all wired to mainnet-shaped architecture.",
            "Security: every privileged path is owner-gated; explicit panic_drain and rotate_agent for incident response.",
          ],
        },
        {
          eyebrow: "Hiring",
          title: "Roles we will open after the hackathon",
          body: "Post-hackathon, the next hires are a security engineer (Solana audit + fuzzing), a DevRel for the SDK, and a partnerships lead targeting agent platforms — Anthropic, Vercel AI SDK, LangChain, and major Solana wallets.",
        },
        {
          eyebrow: "Open governance",
          title: "How collaboration works",
          body: "All code is on GitHub. Issues are public. The roadmap is published. Security reports follow the disclosure process in SECURITY.md. The program is upgradeable today; mainnet plans freeze the upgrade authority behind an independent Squads multisig.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/contact", label: "Get in touch" }}
      secondaryCta={{ href: "/security", label: "Read the security policy" }}
    />
  );
}
