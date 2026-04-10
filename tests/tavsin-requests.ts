import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import {
  buildWalletFixture,
  getAssetTrackerPda,
  hashInstructionData,
  hashRemainingAccounts,
  nativeMint,
  nextAuditPda,
  nextRequestPda,
  owner,
  program,
} from "./helpers";

describe("tavsin requests", () => {
  it("keeps the legacy execute path working", async () => {
    const fixture = await buildWalletFixture();
    const auditPda = await nextAuditPda(fixture.walletPda);

    await program.methods
      .execute(new anchor.BN(0.2 * LAMPORTS_PER_SOL), "legacy transfer")
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        tracker: fixture.legacyTrackerPda,
        auditEntry: auditPda,
        recipient: fixture.recipient.publicKey,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const audit = await program.account.auditEntry.fetch(auditPda);
    expect(audit.approved).to.equal(true);
    expect(audit.outcome).to.equal(4);
  });

  it("submits and executes an auto-approved native request", async () => {
    const fixture = await buildWalletFixture();
    const requestPda = await nextRequestPda(fixture.walletPda);
    const submitAuditPda = await nextAuditPda(fixture.walletPda);
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const instructionHash = hashInstructionData(Buffer.alloc(0));
    const accountsHash = hashRemainingAccounts([]);

    await program.methods
      .submitRequest(
        new anchor.BN(0.25 * LAMPORTS_PER_SOL),
        "auto approved",
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
        assetMint: nativeMint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: null,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const request = await program.account.executionRequest.fetch(requestPda);
    expect(request.status).to.equal(1);

    const executeAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .executeRequest()
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        request: requestPda,
        assetTracker: assetTrackerPda,
        auditEntry: executeAuditPda,
        targetProgram: SystemProgram.programId,
        recipient: fixture.recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const executedRequest = await program.account.executionRequest.fetch(
      requestPda
    );
    const assetTracker = await program.account.assetSpendTracker.fetch(
      assetTrackerPda
    );
    expect(executedRequest.status).to.equal(3);
    expect(assetTracker.spentInPeriod.toNumber()).to.equal(
      0.25 * LAMPORTS_PER_SOL
    );
  });

  it("submits a pending request, approves it, and executes it", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const instructionHash = hashInstructionData(Buffer.alloc(0));
    const accountsHash = hashRemainingAccounts([]);

    await program.methods
      .updatePolicy(
        null,
        null,
        new anchor.BN(0.4 * LAMPORTS_PER_SOL),
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
    const submitAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .submitRequest(
        new anchor.BN(0.6 * LAMPORTS_PER_SOL),
        "pending approval",
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
        assetMint: nativeMint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: null,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const approveAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .approveRequest()
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        request: requestPda,
        auditEntry: approveAuditPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const executeAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .executeRequest()
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        request: requestPda,
        assetTracker: assetTrackerPda,
        auditEntry: executeAuditPda,
        targetProgram: SystemProgram.programId,
        recipient: fixture.recipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const executedRequest = await program.account.executionRequest.fetch(
      requestPda
    );
    expect(executedRequest.status).to.equal(3);
  });

  it("submits a pending request and rejects it", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const instructionHash = hashInstructionData(Buffer.alloc(0));
    const accountsHash = hashRemainingAccounts([]);

    await program.methods
      .updatePolicy(
        null,
        null,
        new anchor.BN(0.4 * LAMPORTS_PER_SOL),
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
    const submitAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .submitRequest(
        new anchor.BN(0.7 * LAMPORTS_PER_SOL),
        "reject me",
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
        assetMint: nativeMint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: null,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const rejectAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .rejectRequest()
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        request: requestPda,
        auditEntry: rejectAuditPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const rejectedRequest = await program.account.executionRequest.fetch(
      requestPda
    );
    expect(rejectedRequest.status).to.equal(2);
  });

  it("uses counterparty policy to force approval", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const instructionHash = hashInstructionData(Buffer.alloc(0));
    const accountsHash = hashRemainingAccounts([]);

    await program.methods
      .upsertCounterpartyPolicy(true, true, null, null, [nativeMint])
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        recipient: fixture.recipient.publicKey,
        counterpartyPolicy: fixture.counterpartyPolicyPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const requestPda = await nextRequestPda(fixture.walletPda);
    const submitAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .submitRequest(
        new anchor.BN(0.2 * LAMPORTS_PER_SOL),
        "counterparty approval",
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
        assetMint: nativeMint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: fixture.counterpartyPolicyPda,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const pendingRequest = await program.account.executionRequest.fetch(
      requestPda
    );
    expect(pendingRequest.status).to.equal(0);
  });

  it("routes a new recipient into approval when policy requires it", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const instructionHash = hashInstructionData(Buffer.alloc(0));
    const accountsHash = hashRemainingAccounts([]);

    await program.methods
      .updatePolicy(
        null,
        null,
        null,
        true,
        null,
        [fixture.recipient.publicKey],
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
    const submitAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .submitRequest(
        new anchor.BN(0.1 * LAMPORTS_PER_SOL),
        "new recipient",
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
        recipient: fixture.alternateRecipient.publicKey,
        assetMint: nativeMint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: null,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const pendingRequest = await program.account.executionRequest.fetch(
      requestPda
    );
    expect(pendingRequest.status).to.equal(0);
  });

  it("rejects execution when the payload hash does not match", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const requestPda = await nextRequestPda(fixture.walletPda);
    const submitAuditPda = await nextAuditPda(fixture.walletPda);
    const instructionHash = hashInstructionData(Buffer.alloc(0));
    const accountsHash = hashRemainingAccounts([]);

    await program.methods
      .submitRequest(
        new anchor.BN(0.1 * LAMPORTS_PER_SOL),
        "hash mismatch",
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
        assetMint: nativeMint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: null,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const executeAuditPda = await nextAuditPda(fixture.walletPda);
    try {
      await program.methods
        .executeRequestWithPayload(Buffer.from([1, 2, 3]))
        .accounts({
          agent: fixture.agent.publicKey,
          wallet: fixture.walletPda,
          policy: fixture.policyPda,
          request: requestPda,
          assetTracker: assetTrackerPda,
          auditEntry: executeAuditPda,
          targetProgram: SystemProgram.programId,
          recipient: fixture.recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([fixture.agent])
        .rpc();

      expect.fail("expected payload hash mismatch");
    } catch (err: any) {
      expect(err.toString()).to.include("Instruction payload does not match");
    }
  });
});
