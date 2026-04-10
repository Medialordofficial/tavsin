import type { Metadata } from "next";
import PageFrame from "@/components/PageFrame";
import { supportPages } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "TavSin White Paper",
  description: "Protocol architecture, trust model, and execution flow for TavSin.",
};

const supportCards = supportPages.filter((page) => page.href !== "/whitepaper");

export default function WhitepaperPage() {
  return (
    <PageFrame
      badge="White Paper"
      title="Policy-enforced smart wallets for AI agents on Solana."
      lead="This paper explains the TavSin operating model: custody lives in wallet state, agents request execution, policies arbitrate the request, and the resulting action is recorded for later review."
      stats={[
        { label: "Policy gates", value: "5+" },
        { label: "Execution chain", value: "Solana" },
        { label: "Auditability", value: "On-chain" },
        { label: "Status", value: "Devnet live" },
      ]}
      sections={[
        {
          eyebrow: "Architecture",
          title: "Control plane, not custody plane",
          body: "The wallet is the control surface. The owner, agent, policies, trackers, and audit log are all modeled as protocol state so the system can reason about what is allowed before a transaction is released.",
        },
        {
          eyebrow: "Lifecycle",
          title: "How an action moves through the protocol",
          body: "An agent constructs a request, the program checks the policy rails, and approved requests become execution records while denied requests become denial records. That gives operators traceability without trusting the model.",
          bullets: [
            "Request creation happens with explicit target program, account set, and payload hash.",
            "The policy engine validates amount, budget, program access, time windows, and freeze state before execution.",
            "Approved actions emit audit records that can be inspected by humans and monitoring tools.",
          ],
        },
        {
          eyebrow: "Data model",
          title: "What lives on-chain",
          body: "Wallet state, policy state, spend trackers, execution requests, and audits are all persisted so the protocol can enforce behavior across time instead of relying on ephemeral application memory.",
        },
        {
          eyebrow: "Trust model",
          title: "What still has to be trusted",
          body: "Users still trust the chain, the deployed program, and the operational discipline around key roles. That is why audit prep, role assignment, and public launch status matter just as much as the product UI.",
          bullets: [
            "Owners control freeze and recovery decisions.",
            "Upgrade authority should remain tightly scoped and documented.",
            "Security review is required before mainnet launch.",
            "Monitoring and incident response roles need to be explicit.",
          ],
        },
        {
          eyebrow: "Limits",
          title: "Current boundaries",
          body: "The current implementation is a launch-ready devnet protocol with a public dashboard and read layer validation. Mainnet operations should only begin after the policy, deployment, and review gates are closed.",
        },
      ]}
      cards={supportCards}
      primaryCta={{ href: "/security", label: "Security Posture" }}
      secondaryCta={{ href: "/docs", label: "Browse Docs" }}
      tertiaryCta={{ href: "/whitepaper.pdf", label: "Download PDF" }}
    />
  );
}
