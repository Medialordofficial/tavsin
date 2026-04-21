/**
 * Derive the Realms native treasury PDA for a given (realm, governance)
 * pair. This pubkey is what TavSin sees as `owner` when wiring a DAO
 * treasury to a TavSin smart wallet.
 *
 * Run:
 *   REALM=<realm pubkey> GOVERNANCE=<governance pubkey> npm run derive-treasury
 */

import { PublicKey } from "@solana/web3.js";
import { getNativeTreasuryAddress } from "@solana/spl-governance";

// Mainnet & devnet program ID for SPL Governance v3.
const SPL_GOVERNANCE_PROGRAM_ID = new PublicKey(
  process.env.GOVERNANCE_PROGRAM_ID ??
    "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

async function main() {
  const realmRaw = process.env.REALM;
  const governanceRaw = process.env.GOVERNANCE;
  if (!realmRaw || !governanceRaw) {
    throw new Error("Set REALM=<pubkey> and GOVERNANCE=<pubkey>");
  }

  const realm = new PublicKey(realmRaw);
  const governance = new PublicKey(governanceRaw);

  const treasury = await getNativeTreasuryAddress(
    SPL_GOVERNANCE_PROGRAM_ID,
    governance
  );

  console.log("Realm:        ", realm.toBase58());
  console.log("Governance:   ", governance.toBase58());
  console.log("Treasury PDA: ", treasury.toBase58());
  console.log("\nUse the Treasury PDA as `owner` when calling tavsin.createWallet.");
  console.log("All TavSin owner-side actions will then require a Realms proposal");
  console.log("that passes token-weighted voting before they can execute.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
