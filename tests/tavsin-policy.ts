import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import {
  buildWalletFixture,
  fetchWalletAccount,
  getAssetTrackerPda,
  nativeMint,
  nextAuditPda,
  owner,
  program,
  provider,
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
    expect(policy.approvalThreshold.toNumber()).to.equal(
      0.4 * LAMPORTS_PER_SOL
    );
    expect(policy.requireApprovalForNewRecipients).to.equal(true);
    expect(policy.allowedRecipients[0].toBase58()).to.equal(
      fixture.recipient.publicKey.toBase58()
    );
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
    expect(counterpartyPolicy.allowedMints[0].toBase58()).to.equal(
      nativeMint.toBase58()
    );
  });

  it("freezes a wallet and blocks execution", async () => {
    const fixture = await buildWalletFixture();

    await program.methods
      .freezeWallet()
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
      })
      .rpc();

    const wallet = await fetchWalletAccount(fixture.walletPda);
    expect(wallet.frozen).to.equal(true);

    // Attempt execute on frozen wallet — should soft-deny
    const auditPda = await nextAuditPda(fixture.walletPda);
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    await program.methods
      .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "frozen test")
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

    const audit = await program.account.auditEntry.fetch(auditPda);
    expect(audit.approved).to.equal(false);
    // OUTCOME_DENIED = 1
    expect(audit.outcome).to.equal(1);
  });

  it("unfreezes a wallet and allows execution again", async () => {
    const fixture = await buildWalletFixture();

    // Freeze
    await program.methods
      .freezeWallet()
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
      })
      .rpc();

    // Unfreeze
    await program.methods
      .unfreezeWallet()
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
      })
      .rpc();

    const wallet = await fetchWalletAccount(fixture.walletPda);
    expect(wallet.frozen).to.equal(false);

    // Now execute should succeed
    const auditPda = await nextAuditPda(fixture.walletPda);
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    await program.methods
      .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "unfrozen test")
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

    const audit = await program.account.auditEntry.fetch(auditPda);
    expect(audit.approved).to.equal(true);
  });

  it("rejects freeze from a non-owner", async () => {
    const fixture = await buildWalletFixture();

    try {
      await program.methods
        .freezeWallet()
        .accounts({
          owner: fixture.agent.publicKey,
          wallet: fixture.walletPda,
        })
        .signers([fixture.agent])
        .rpc();

      expect.fail("should have rejected non-owner freeze");
    } catch (err: any) {
      expect(err.toString()).to.not.include("should have rejected");
    }
  });

  it("enforces time window restrictions", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    // Get current time-of-day in seconds since UTC midnight
    const now = Math.floor(Date.now() / 1000);
    const secondsSinceMidnight = now % 86400;

    // Set a time window that EXCLUDES the current time
    // Window: [current+3600, current+7200] (1-2 hours from now)
    const start = (secondsSinceMidnight + 3600) % 86400;
    const end = (secondsSinceMidnight + 7200) % 86400;

    await program.methods
      .updatePolicy(
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        new anchor.BN(start),
        new anchor.BN(end)
      )
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
      })
      .rpc();

    // Execute should soft-deny due to time window
    const auditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "time window test")
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

    const audit = await program.account.auditEntry.fetch(auditPda);
    expect(audit.approved).to.equal(false);
  });

  it("enforces blocked mints on submit_request", async () => {
    const fixture = await buildWalletFixture();
    const blockedMint = nativeMint; // Block native SOL transfers
    const [assetTrackerPda] = getAssetTrackerPda(
      fixture.walletPda,
      blockedMint
    );

    await program.methods
      .updatePolicy(
        null,
        null,
        null,
        null,
        null,
        null,
        [blockedMint],
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

    const { hashInstructionData, hashRemainingAccounts, nextRequestPda } =
      await import("./helpers");
    const instructionHash = hashInstructionData(Buffer.alloc(0));
    const accountsHash = hashRemainingAccounts([]);

    const requestPda = await nextRequestPda(fixture.walletPda);
    const submitAuditPda = await nextAuditPda(fixture.walletPda);

    // Blocked mints result in a soft-deny (OK with REJECTED status), not a hard error
    await program.methods
      .submitRequest(
        new anchor.BN(0.1 * LAMPORTS_PER_SOL),
        "blocked mint",
        instructionHash,
        accountsHash,
        null
      )
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        request: requestPda,
        auditEntry: submitAuditPda,
        recipient: fixture.recipient.publicKey,
        assetMint: blockedMint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: null,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const request = await program.account.executionRequest.fetch(requestPda);
    // REQUEST_STATUS_REJECTED = 2
    expect(request.status).to.equal(2);

    const audit = await program.account.auditEntry.fetch(submitAuditPda);
    // REASON_BLOCKED_MINT = 6
    expect(audit.denialReason).to.equal(6);
  });

  it("enforces program allowlist on execute", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    // Set allowlist to only include a random program (not SystemProgram)
    const randomProgram = Keypair.generate().publicKey;
    await program.methods
      .updatePolicy(
        null,
        null,
        null,
        null,
        [randomProgram],
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

    // Execute targeting SystemProgram should be soft-denied
    const auditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "program allowlist")
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

    const audit = await program.account.auditEntry.fetch(auditPda);
    expect(audit.approved).to.equal(false);
  });

  it("enforces daily budget limit", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    // Set a very low daily budget
    await program.methods
      .updatePolicy(
        new anchor.BN(5 * LAMPORTS_PER_SOL),
        new anchor.BN(0.3 * LAMPORTS_PER_SOL),
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

    // First transfer succeeds
    const auditPda1 = await nextAuditPda(fixture.walletPda);
    await program.methods
      .execute(new anchor.BN(0.2 * LAMPORTS_PER_SOL), "first transfer")
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        tracker: fixture.legacyTrackerPda,
        assetTracker: assetTrackerPda,
        auditEntry: auditPda1,
        recipient: fixture.recipient.publicKey,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const audit1 = await program.account.auditEntry.fetch(auditPda1);
    expect(audit1.approved).to.equal(true);

    // Second transfer exceeds daily budget — should soft-deny
    const auditPda2 = await nextAuditPda(fixture.walletPda);
    await program.methods
      .execute(new anchor.BN(0.2 * LAMPORTS_PER_SOL), "over budget")
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        tracker: fixture.legacyTrackerPda,
        assetTracker: assetTrackerPda,
        auditEntry: auditPda2,
        recipient: fixture.recipient.publicKey,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const audit2 = await program.account.auditEntry.fetch(auditPda2);
    expect(audit2.approved).to.equal(false);
  });
});
