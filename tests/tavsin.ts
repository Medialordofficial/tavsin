import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Tavsin } from "../target/types/tavsin";
import { expect } from "chai";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

describe("tavsin", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.tavsin as Program<Tavsin>;
  const owner = provider.wallet;
  const agent = Keypair.generate();
  const recipient = Keypair.generate();

  let walletPda: PublicKey;
  let walletBump: number;
  let policyPda: PublicKey;
  let trackerPda: PublicKey;

  const maxPerTx = new anchor.BN(LAMPORTS_PER_SOL);
  const maxDaily = new anchor.BN(5 * LAMPORTS_PER_SOL);
  const fundAmount = new anchor.BN(10 * LAMPORTS_PER_SOL);

  function getAuditPda(txCount: number): [PublicKey, number] {
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64LE(BigInt(txCount));
    return PublicKey.findProgramAddressSync(
      [Buffer.from("audit"), walletPda.toBuffer(), buf],
      program.programId
    );
  }

  before(async () => {
    [walletPda, walletBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("wallet"), owner.publicKey.toBuffer(), agent.publicKey.toBuffer()],
      program.programId
    );
    [policyPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("policy"), walletPda.toBuffer()],
      program.programId
    );
    [trackerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tracker"), walletPda.toBuffer()],
      program.programId
    );

    const sig = await provider.connection.requestAirdrop(
      agent.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
  });

  describe("create_wallet", () => {
    it("creates a smart wallet with policy and tracker", async () => {
      await program.methods
        .createWallet(maxPerTx, maxDaily, [], null, null)
        .accounts({
          owner: owner.publicKey,
          agent: agent.publicKey,
          wallet: walletPda,
          policy: policyPda,
          tracker: trackerPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const wallet = await program.account.smartWallet.fetch(walletPda);
      expect(wallet.owner.toString()).to.equal(owner.publicKey.toString());
      expect(wallet.agent.toString()).to.equal(agent.publicKey.toString());
      expect(wallet.frozen).to.equal(false);
      expect(wallet.totalApproved.toNumber()).to.equal(0);
      expect(wallet.totalDenied.toNumber()).to.equal(0);

      const policy = await program.account.policy.fetch(policyPda);
      expect(policy.maxPerTx.toNumber()).to.equal(LAMPORTS_PER_SOL);
      expect(policy.maxDaily.toNumber()).to.equal(5 * LAMPORTS_PER_SOL);
      expect(policy.allowedPrograms.length).to.equal(0);
      expect(policy.timeWindowStart).to.be.null;
      expect(policy.timeWindowEnd).to.be.null;

      const tracker = await program.account.spendTracker.fetch(trackerPda);
      expect(tracker.spentInPeriod.toNumber()).to.equal(0);
      expect(tracker.periodDuration.toNumber()).to.equal(86400);
    });
  });

  describe("fund_wallet", () => {
    it("deposits SOL into the wallet PDA", async () => {
      const balanceBefore = await provider.connection.getBalance(walletPda);

      await program.methods
        .fundWallet(fundAmount)
        .accounts({
          owner: owner.publicKey,
          wallet: walletPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const balanceAfter = await provider.connection.getBalance(walletPda);
      expect(balanceAfter - balanceBefore).to.equal(10 * LAMPORTS_PER_SOL);
    });
  });

  describe("execute", () => {
    it("approves a transaction within policy limits", async () => {
      const [auditPda] = getAuditPda(0);
      const amount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);

      await program.methods
        .execute(amount, "test transfer")
        .accounts({
          agent: agent.publicKey,
          wallet: walletPda,
          policy: policyPda,
          tracker: trackerPda,
          auditEntry: auditPda,
          recipient: recipient.publicKey,
          targetProgram: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();

      const audit = await program.account.auditEntry.fetch(auditPda);
      expect(audit.approved).to.equal(true);
      expect(audit.denialReason).to.equal(0);
      expect(audit.amount.toNumber()).to.equal(0.5 * LAMPORTS_PER_SOL);
      expect(audit.memo).to.equal("test transfer");

      const wallet = await program.account.smartWallet.fetch(walletPda);
      expect(wallet.totalApproved.toNumber()).to.equal(1);
      expect(wallet.totalDenied.toNumber()).to.equal(0);

      const tracker = await program.account.spendTracker.fetch(trackerPda);
      expect(tracker.spentInPeriod.toNumber()).to.equal(0.5 * LAMPORTS_PER_SOL);
    });

    it("denies a transaction exceeding per-tx limit", async () => {
      const [auditPda] = getAuditPda(1);
      const amount = new anchor.BN(2 * LAMPORTS_PER_SOL);

      await program.methods
        .execute(amount, "too much per tx")
        .accounts({
          agent: agent.publicKey,
          wallet: walletPda,
          policy: policyPda,
          tracker: trackerPda,
          auditEntry: auditPda,
          recipient: recipient.publicKey,
          targetProgram: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();

      const audit = await program.account.auditEntry.fetch(auditPda);
      expect(audit.approved).to.equal(false);
      expect(audit.denialReason).to.equal(1);

      const wallet = await program.account.smartWallet.fetch(walletPda);
      expect(wallet.totalDenied.toNumber()).to.equal(1);
    });

    it("denies a transaction exceeding daily budget", async () => {
      for (let i = 0; i < 5; i++) {
        const txCount = 2 + i;
        const [auditPda] = getAuditPda(txCount);
        await program.methods
          .execute(new anchor.BN(0.9 * LAMPORTS_PER_SOL), "batch " + i)
          .accounts({
            agent: agent.publicKey,
            wallet: walletPda,
            policy: policyPda,
            tracker: trackerPda,
            auditEntry: auditPda,
            recipient: recipient.publicKey,
            targetProgram: SystemProgram.programId,
            systemProgram: SystemProgram.programId,
          })
          .signers([agent])
          .rpc();
      }

      const wallet = await program.account.smartWallet.fetch(walletPda);
      const txCount = wallet.totalApproved.toNumber() + wallet.totalDenied.toNumber();
      const [auditPda] = getAuditPda(txCount);

      await program.methods
        .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "over daily limit")
        .accounts({
          agent: agent.publicKey,
          wallet: walletPda,
          policy: policyPda,
          tracker: trackerPda,
          auditEntry: auditPda,
          recipient: recipient.publicKey,
          targetProgram: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();

      const audit = await program.account.auditEntry.fetch(auditPda);
      expect(audit.approved).to.equal(false);
      expect(audit.denialReason).to.equal(2);
    });
  });

  describe("freeze_wallet", () => {
    it("freezes the wallet", async () => {
      await program.methods
        .freezeWallet()
        .accounts({
          owner: owner.publicKey,
          wallet: walletPda,
        })
        .rpc();

      const wallet = await program.account.smartWallet.fetch(walletPda);
      expect(wallet.frozen).to.equal(true);
    });

    it("denies execute on frozen wallet", async () => {
      const wallet = await program.account.smartWallet.fetch(walletPda);
      const txCount = wallet.totalApproved.toNumber() + wallet.totalDenied.toNumber();
      const [auditPda] = getAuditPda(txCount);

      await program.methods
        .execute(new anchor.BN(0.1 * LAMPORTS_PER_SOL), "frozen test")
        .accounts({
          agent: agent.publicKey,
          wallet: walletPda,
          policy: policyPda,
          tracker: trackerPda,
          auditEntry: auditPda,
          recipient: recipient.publicKey,
          targetProgram: SystemProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();

      const audit = await program.account.auditEntry.fetch(auditPda);
      expect(audit.approved).to.equal(false);
      expect(audit.denialReason).to.equal(5);
    });
  });

  describe("unfreeze_wallet", () => {
    it("unfreezes the wallet", async () => {
      await program.methods
        .unfreezeWallet()
        .accounts({
          owner: owner.publicKey,
          wallet: walletPda,
        })
        .rpc();

      const wallet = await program.account.smartWallet.fetch(walletPda);
      expect(wallet.frozen).to.equal(false);
    });
  });

  describe("update_policy", () => {
    it("updates policy parameters", async () => {
      const newMaxPerTx = new anchor.BN(2 * LAMPORTS_PER_SOL);
      const newMaxDaily = new anchor.BN(20 * LAMPORTS_PER_SOL);

      await program.methods
        .updatePolicy(newMaxPerTx, newMaxDaily, null, null, null)
        .accounts({
          owner: owner.publicKey,
          wallet: walletPda,
          policy: policyPda,
        })
        .rpc();

      const policy = await program.account.policy.fetch(policyPda);
      expect(policy.maxPerTx.toNumber()).to.equal(2 * LAMPORTS_PER_SOL);
      expect(policy.maxDaily.toNumber()).to.equal(20 * LAMPORTS_PER_SOL);
    });

    it("rejects update from non-owner", async () => {
      try {
        await program.methods
          .updatePolicy(new anchor.BN(100), null, null, null, null)
          .accounts({
            owner: agent.publicKey,
            wallet: walletPda,
            policy: policyPda,
          })
          .signers([agent])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.not.include("Should have thrown");
      }
    });
  });

  describe("withdraw", () => {
    it("owner withdraws SOL from wallet", async () => {
      const ownerBalanceBefore = await provider.connection.getBalance(
        owner.publicKey
      );
      const withdrawAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);

      await program.methods
        .withdraw(withdrawAmount)
        .accounts({
          owner: owner.publicKey,
          wallet: walletPda,
        })
        .rpc();

      const ownerBalanceAfter = await provider.connection.getBalance(
        owner.publicKey
      );
      expect(ownerBalanceAfter).to.be.greaterThan(ownerBalanceBefore);
    });

    it("rejects withdraw from non-owner", async () => {
      try {
        await program.methods
          .withdraw(new anchor.BN(LAMPORTS_PER_SOL))
          .accounts({
            owner: agent.publicKey,
            wallet: walletPda,
          })
          .signers([agent])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.toString()).to.not.include("Should have thrown");
      }
    });
  });
});
