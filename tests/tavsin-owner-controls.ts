import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import {
  buildWalletFixture,
  fetchWalletAccount,
  getAssetTrackerPda,
  getRequestPda,
  nativeMint,
  nextAuditPda,
  nextRequestPda,
  owner,
  program,
  provider,
} from "./helpers";

describe("tavsin owner controls (rotate / panic / close)", () => {
  it("rotate_agent: owner swaps the authorized agent key", async () => {
    const fixture = await buildWalletFixture();
    const newAgent = Keypair.generate();

    await program.methods
      .rotateAgent()
      .accounts({
        owner: owner.publicKey,
        newAgent: newAgent.publicKey,
        wallet: fixture.walletPda,
      })
      .rpc();

    const wallet = await fetchWalletAccount(fixture.walletPda);
    expect(wallet.agent.toBase58()).to.equal(newAgent.publicKey.toBase58());

    // Old agent can no longer execute
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const auditPda = await nextAuditPda(fixture.walletPda);
    let blocked = false;
    try {
      await program.methods
        .execute(new anchor.BN(0.05 * LAMPORTS_PER_SOL), "stale agent")
        .accounts({
          agent: fixture.agent.publicKey,
          wallet: fixture.walletPda,
          policy: fixture.policyPda,
          tracker: fixture.legacyTrackerPda,
          assetTracker: assetTrackerPda,
          auditEntry: auditPda,
          recipient: fixture.recipient.publicKey,
          targetProgram: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([fixture.agent])
        .rpc();
    } catch (err: any) {
      blocked = true;
      expect(err.toString()).to.match(/UnauthorizedAgent|constraint/i);
    }
    expect(blocked, "old agent must be rejected after rotate").to.equal(true);
  });

  it("rotate_agent: refuses no-op rotation to the same key", async () => {
    const fixture = await buildWalletFixture();
    let rejected = false;
    try {
      await program.methods
        .rotateAgent()
        .accounts({
          owner: owner.publicKey,
          newAgent: fixture.agent.publicKey,
          wallet: fixture.walletPda,
        })
        .rpc();
    } catch (err: any) {
      rejected = true;
      expect(err.toString()).to.include("AgentUnchanged");
    }
    expect(rejected).to.equal(true);
  });

  it("panic_drain: sweeps spendable lamports and freezes the wallet", async () => {
    const fixture = await buildWalletFixture();
    const recovery = Keypair.generate();

    const beforeWallet = await provider.connection.getBalance(fixture.walletPda);
    const beforeRecovery = await provider.connection.getBalance(recovery.publicKey);
    expect(beforeWallet).to.be.greaterThan(LAMPORTS_PER_SOL); // funded by fixture

    await program.methods
      .panicDrain()
      .accounts({
        owner: owner.publicKey,
        destination: recovery.publicKey,
        wallet: fixture.walletPda,
      })
      .rpc();

    const afterWallet = await provider.connection.getBalance(fixture.walletPda);
    const afterRecovery = await provider.connection.getBalance(recovery.publicKey);

    expect(afterRecovery - beforeRecovery).to.be.greaterThan(0);
    // wallet should be at exactly its rent-exempt minimum (no spendable lamports left)
    const wallet = await fetchWalletAccount(fixture.walletPda);
    expect(wallet.frozen, "wallet must be auto-frozen by panic_drain").to.equal(true);
    expect(afterWallet).to.be.lessThan(beforeWallet);
  });

  it("close_request: reclaims rent on a rejected request", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    // Force pending → reject
    await program.methods
      .updatePolicy(
        null,
        null,
        new anchor.BN(0.01 * LAMPORTS_PER_SOL),
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
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
      })
      .rpc();

    const requestPda = await nextRequestPda(fixture.walletPda);
    const auditPda = await nextAuditPda(fixture.walletPda);
    const fakeIxHash = new Array(32).fill(0);
    const fakeAcctsHash = new Array(32).fill(0);

    await program.methods
      .submitRequest(
        new anchor.BN(0.05 * LAMPORTS_PER_SOL),
        "needs approval",
        fakeIxHash,
        fakeAcctsHash,
        null
      )
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        tracker: fixture.legacyTrackerPda,
        assetTracker: assetTrackerPda,
        request: requestPda,
        auditEntry: auditPda,
        recipient: fixture.recipient.publicKey,
        targetProgram: SystemProgram.programId,
        assetMint: nativeMint,
        counterpartyPolicy: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    await program.methods
      .rejectRequest()
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        request: requestPda,
        auditEntry: await nextAuditPda(fixture.walletPda),
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const ownerBefore = await provider.connection.getBalance(owner.publicKey);
    const requestBefore = await provider.connection.getBalance(requestPda);
    expect(requestBefore).to.be.greaterThan(0);

    await program.methods
      .closeRequest()
      .accounts({
        owner: owner.publicKey,
        rentRecipient: owner.publicKey,
        wallet: fixture.walletPda,
        request: requestPda,
      })
      .rpc();

    const requestAfter = await provider.connection.getBalance(requestPda);
    const ownerAfter = await provider.connection.getBalance(owner.publicKey);
    expect(requestAfter).to.equal(0);
    expect(ownerAfter).to.be.greaterThan(ownerBefore - 0.01 * LAMPORTS_PER_SOL); // net positive after fees
  });

  it("close_request: refuses to close a still-pending non-expired request", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    await program.methods
      .updatePolicy(
        null,
        null,
        new anchor.BN(0.01 * LAMPORTS_PER_SOL),
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
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
      })
      .rpc();

    const requestPda = await nextRequestPda(fixture.walletPda);
    const auditPda = await nextAuditPda(fixture.walletPda);
    const zero = new Array(32).fill(0);

    await program.methods
      .submitRequest(new anchor.BN(0.05 * LAMPORTS_PER_SOL), "pending", zero, zero, null)
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        tracker: fixture.legacyTrackerPda,
        assetTracker: assetTrackerPda,
        request: requestPda,
        auditEntry: auditPda,
        recipient: fixture.recipient.publicKey,
        targetProgram: SystemProgram.programId,
        assetMint: nativeMint,
        counterpartyPolicy: null,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    let denied = false;
    try {
      await program.methods
        .closeRequest()
        .accounts({
          owner: owner.publicKey,
          rentRecipient: owner.publicKey,
          wallet: fixture.walletPda,
          request: requestPda,
        })
        .rpc();
    } catch (err: any) {
      denied = true;
      expect(err.toString()).to.include("RequestStillPending");
    }
    expect(denied).to.equal(true);
  });

  it("close_audit_entry: owner reclaims audit rent and entry vanishes", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const auditPda = await nextAuditPda(fixture.walletPda);

    await program.methods
      .execute(new anchor.BN(0.01 * LAMPORTS_PER_SOL), "make audit")
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        tracker: fixture.legacyTrackerPda,
        assetTracker: assetTrackerPda,
        auditEntry: auditPda,
        recipient: fixture.recipient.publicKey,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const before = await provider.connection.getBalance(auditPda);
    expect(before).to.be.greaterThan(0);

    await program.methods
      .closeAuditEntry()
      .accounts({
        owner: owner.publicKey,
        rentRecipient: owner.publicKey,
        wallet: fixture.walletPda,
        auditEntry: auditPda,
      })
      .rpc();

    const after = await provider.connection.getBalance(auditPda);
    expect(after).to.equal(0);
  });
});
