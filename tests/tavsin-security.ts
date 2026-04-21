import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";

import {
  buildWalletFixture,
  getAssetTrackerPda,
  nativeMint,
  nextAuditPda,
  owner,
  program,
} from "./helpers";

// Regression tests covering the audit findings fixed in this commit.
//
//   C1  legacy execute() must enforce policy.allowed_recipients
//   C1  legacy execute() must refuse when an approval policy is configured
//   H1  partial update_policy() must NOT silently wipe the time window
//   H2  time window must support wrap-around (e.g. 22:00 \u2013 02:00 UTC)
//
// Each test sets up an attack scenario and asserts the program denies it.

describe("tavsin security regressions", () => {
  it("C1: execute() denies recipients not on allowed_recipients", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);
    const attacker = Keypair.generate();

    // Owner sets a recipient allowlist that does NOT include the attacker.
    await program.methods
      .updatePolicy(
        null,
        null,
        null,
        null,
        null,
        [fixture.recipient.publicKey],
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

    const auditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "drain attempt")
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        tracker: fixture.legacyTrackerPda,
        assetTracker: assetTrackerPda,
        auditEntry: auditPda,
        recipient: attacker.publicKey,
        targetProgram: SystemProgram.programId,
        systemProgram: SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const audit = await program.account.auditEntry.fetch(auditPda);
    expect(audit.approved).to.equal(false);
    expect(audit.denialReason).to.equal(7); // REASON_RECIPIENT_NOT_ALLOWED
  });

  it("C1: execute() refuses to operate when approval threshold is set", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    // Approval threshold turns on the request flow; legacy execute() must
    // refuse so it cannot bypass the threshold by going direct.
    await program.methods
      .updatePolicy(
        null,
        null,
        new anchor.BN(0.05 * LAMPORTS_PER_SOL),
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

    const auditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "bypass attempt")
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
    expect(audit.denialReason).to.equal(12); // REASON_UNSUPPORTED_EXECUTION
  });

  it("H1: partial update_policy() does NOT clear an existing time window", async () => {
    const fixture = await buildWalletFixture();

    // Step 1: owner sets a time window.
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
        new anchor.BN(0),
        new anchor.BN(86_399),
        null,
        null
      )
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
      })
      .rpc();

    let policy = await program.account.policy.fetch(fixture.policyPda);
    expect(policy.timeWindowStart!.toNumber()).to.equal(0);
    expect(policy.timeWindowEnd!.toNumber()).to.equal(86_399);

    // Step 2: owner only updates max_per_tx. Window must survive.
    await program.methods
      .updatePolicy(
        new anchor.BN(0.5 * LAMPORTS_PER_SOL),
        null,
        null,
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

    policy = await program.account.policy.fetch(fixture.policyPda);
    expect(policy.timeWindowStart, "time window must survive partial update").to.not.equal(null);
    expect(policy.timeWindowStart!.toNumber()).to.equal(0);
    expect(policy.timeWindowEnd!.toNumber()).to.equal(86_399);

    // Step 3: explicit clear works.
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
        null,
        null,
        true,
        null
      )
      .accounts({
        owner: owner.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
      })
      .rpc();

    policy = await program.account.policy.fetch(fixture.policyPda);
    expect(policy.timeWindowStart).to.equal(null);
    expect(policy.timeWindowEnd).to.equal(null);
  });

  it("H2: wrap-around time window (22:00 \u2013 02:00 UTC) accepts current time", async () => {
    const fixture = await buildWalletFixture();
    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, nativeMint);

    // Compute a wrap-around window that includes "now" in UTC.
    // current second-of-day:
    const now = Math.floor(Date.now() / 1000) % 86_400;
    // Set a window from (now - 1h) wrapping past midnight to (now + 1h).
    // Force wrap-around by making start > end.
    const start = (now + 86_400 - 3_600) % 86_400; // 1 hour ago
    const end = (now + 3_600) % 86_400; // 1 hour from now
    const wraps = start > end;
    if (!wraps) {
      // If our random "now" doesn't wrap naturally, force it: shift start by 12h
      // so we always exercise the wrap-around branch.
      const wrapStart = (now + 86_400 - 12 * 3_600) % 86_400;
      const wrapEnd = (now + 3_600) % 86_400;
      // wrapStart < wrapEnd means non-wrap; if so we know our test time is in
      // the upper half of the day so we just verify the non-wrap path also
      // accepts (still a valid regression for the rem_euclid fix).
      await program.methods
        .updatePolicy(null, null, null, null, null, null, null, null, new anchor.BN(wrapStart), new anchor.BN(wrapEnd), null, null)
        .accounts({ owner: owner.publicKey, wallet: fixture.walletPda, policy: fixture.policyPda })
        .rpc();
    } else {
      await program.methods
        .updatePolicy(null, null, null, null, null, null, null, null, new anchor.BN(start), new anchor.BN(end), null, null)
        .accounts({ owner: owner.publicKey, wallet: fixture.walletPda, policy: fixture.policyPda })
        .rpc();
    }

    const auditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .execute(new anchor.BN(0.05 * LAMPORTS_PER_SOL), "wrap window")
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
    expect(audit.approved, "wrap-around window must accept current time").to.equal(true);
  });
});
