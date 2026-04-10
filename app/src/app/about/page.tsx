import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "About TavSin",
  description: "Mission, origin, and operating principles for TavSin.",
};

const supportCards = supportPages.filter((page) => page.href !== "/about");

export default function AboutPage() {
  return (
    <PageFrame
      badge="About TavSin"
      title="A protocol for autonomous capital that still answers to an operator."
      lead="TavSin exists because AI agents should be able to move money without being able to own the money. The protocol keeps custody in smart-wallet rails, applies policy before execution, and leaves a visible audit trail for every decision."
      stats={[
        { label: "Core thesis", value: "Agents execute" },
        { label: "Custody model", value: "Protocol controlled" },
        { label: "Audit posture", value: "Fully visible" },
        { label: "Network", value: "Solana devnet" },
      ]}
      sections={[
        {
          eyebrow: "Origin",
          title: "Why it exists",
          body: "Most agent products either hand over keys or keep humans in the loop forever. TavSin takes a different path: the wallet becomes the control plane, and the agent only gets an execution mandate inside hard limits.",
        },
        {
          eyebrow: "Principles",
          title: "How the protocol is meant to feel",
          body: "Serious infrastructure is legible. TavSin should read like a protocol operator's console, not a marketing page. That means clear controls, explicit status, and a design language that communicates trust rather than hype.",
          bullets: [
            "Custody stays in protocol-owned wallet state, not in the model.",
            "Policies are deterministic and reviewable on-chain.",
            "Every action should be explainable to an operator after the fact.",
            "Owners retain freeze and recovery power at all times.",
          ],
        },
        {
          eyebrow: "What it is not",
          title: "The scope stays narrow",
          body: "TavSin is not a generic AI wrapper, not a multisig clone, and not a passive risk-warning layer. It is the missing governance layer between agent autonomy and financial control.",
        },
        {
          eyebrow: "Audience",
          title: "Who this is for",
          body: "Teams building agent workflows, payment automation, treasury operations, and controlled execution on Solana need a system that can enforce policy without removing speed. TavSin is built for that operating reality.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/whitepaper", label: "Read White Paper" }}
      secondaryCta={{ href: "/dashboard", label: "Open Dashboard" }}
    />
  );
}
