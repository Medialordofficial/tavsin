import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import {
  buildWalletFixture,
  nativeMint,
  owner,
  program,
} from "./helpers";

describe("tavsin policy", () => {
  it("updates policy v2 fields", async () => {
    const fixture = await buildWalletFixture();
    const blockedMint = Keypair.generate().publicKey;
    const nativeRule = {
      mint: nativeMint,
      maxPerTx: new anchor.BN(0.8 * LAMPORTS_PER_SOL),
      maxDaily: new anchor.BN(3 * LAMPORTS_PER_SOL),
      requireApprovalAbove: new anchor.BN(0.4 * LAMPORTS_PER_SOL),
    };

    await program.methods
      .updatePolicy(
        new anchor.BN(2 * LAMPORTS_PER_SOL),
        new anchor.BN(20 * LAMPORTS_PER_SOL),
        new anchor.BN(0.4 * LAMPORTS_PER_SOL),
        true,
        [SystemProgram.programId],
        [fixture.recipient.publicKey],
        [blockedMint],
        [nativeRule],
        null,
        null
      )
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
      })
      .rpc();

    const policy = await program.account.policy.fetch(fixture.policyPda);
    expect(policy.version).to.equal(2);
    expect(policy.maxPerTx.toNumber()).to.equal(2 * LAMPORTS_PER_SOL);
    expect(policy.maxDaily.toNumber()).to.equal(20 * LAMPORTS_PER_SOL);
    expect(policy.approvalThreshold.toNumber()).to.equal(0.4 * LAMPORTS_PER_SOL);
    expect(policy.requireApprovalForNewRecipients).to.equal(true);
    expect(policy.allowedRecipients[0].toBase58()).to.equal(fixture.recipient.publicKey.toBase58());
    expect(policy.blockedMints[0].toBase58()).to.equal(blockedMint.toBase58());
    expect(policy.mintRules).to.have.length(1);
  });

  it("rejects policy update from a non-owner", async () => {
    const fixture = await buildWalletFixture();

    try {
      await program.methods
        .updatePolicy(
          new anchor.BN(100),
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null
        )
        .accounts({
          owner: fixture.agent.publicKey,
          wallet: fixture.walletPda,
          policy: fixture.policyPda,
        })
        .signers([fixture.agent])
        .rpc();

      expect.fail("should have rejected non-owner update");
    } catch (err: any) {
      expect(err.toString()).to.not.include("should have rejected");
    }
  });

  it("upserts a counterparty policy", async () => {
    const fixture = await buildWalletFixture();

    await program.methods
      .upsertCounterpartyPolicy(
        true,
        true,
        new anchor.BN(0.5 * LAMPORTS_PER_SOL),
        new anchor.BN(2 * LAMPORTS_PER_SOL),
        [nativeMint]
      )
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        recipient: fixture.recipient.publicKey,
        counterpartyPolicy: fixture.counterpartyPolicyPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const counterpartyPolicy = await program.account.counterpartyPolicy.fetch(
      fixture.counterpartyPolicyPda
    );
    expect(counterpartyPolicy.enabled).to.equal(true);
    expect(counterpartyPolicy.requireApproval).to.equal(true);
    expect(counterpartyPolicy.allowedMints[0].toBase58()).to.equal(nativeMint.toBase58());
  });
});