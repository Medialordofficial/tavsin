/**
 * Wrap a TavSin `update_policy` instruction in a Realms proposal so DAO
 * token holders can vote on changing the agent's spending limits.
 *
 * This is a reference scaffold — wire the actual ix builder using
 * @tavsin/sdk and submit it as a proposal transaction via
 * @solana/spl-governance's `withCreateProposal` + `withInsertTransaction`
 * helpers.
 *
 * Run:
 *   REALM=<realm pubkey> GOVERNANCE=<governance pubkey> \
 *   TAVSIN_WALLET=<wallet PDA> NEW_MAX_PER_TX=1000000 \
 *   npm run propose-update-policy
 */

import { PublicKey } from "@solana/web3.js";
import {
  getNativeTreasuryAddress,
  // withCreateProposal,
  // withInsertTransaction,
  // VoteType,
} from "@solana/spl-governance";

const SPL_GOVERNANCE_PROGRAM_ID = new PublicKey(
  process.env.GOVERNANCE_PROGRAM_ID ??
    "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

async function main() {
  const realmRaw = process.env.REALM;
  const governanceRaw = process.env.GOVERNANCE;
  const tavsinWalletRaw = process.env.TAVSIN_WALLET;
  const newMaxPerTxRaw = process.env.NEW_MAX_PER_TX;
  if (!realmRaw || !governanceRaw || !tavsinWalletRaw || !newMaxPerTxRaw) {
    throw new Error(
      "Set REALM, GOVERNANCE, TAVSIN_WALLET, and NEW_MAX_PER_TX env vars."
    );
  }

  const realm = new PublicKey(realmRaw);
  const governance = new PublicKey(governanceRaw);
  const tavsinWallet = new PublicKey(tavsinWalletRaw);
  const treasury = await getNativeTreasuryAddress(
    SPL_GOVERNANCE_PROGRAM_ID,
    governance
  );

  console.log("Realms proposal target:");
  console.log("  Realm:       ", realm.toBase58());
  console.log("  Governance:  ", governance.toBase58());
  console.log("  Treasury:    ", treasury.toBase58(), "(== TavSin owner)");
  console.log("  TavSin wallet:", tavsinWallet.toBase58());
  console.log("  New max/tx:  ", newMaxPerTxRaw);

  console.log(
    "\nPRODUCTION TODO: build the TavSin update_policy ix, wrap it in a"
  );
  console.log(
    "Realms proposal via withCreateProposal + withInsertTransaction, and"
  );
  console.log(
    "submit. The treasury PDA will sign on execute_transaction once the"
  );
  console.log("proposal passes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
