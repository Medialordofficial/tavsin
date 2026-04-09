import * as anchor from "@anchor-lang/core";
import { expect } from "chai";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createTransferCheckedInstruction,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

import {
  buildWalletFixture,
  getAssetTrackerPda,
  hashInstructionData,
  hashRemainingAccounts,
  normalizeWalletSignedAccounts,
  nextAuditPda,
  nextRequestPda,
  owner,
  program,
  provider,
} from "./helpers";

describe("tavsin spl", () => {
  it("executes an SPL token request and tracks spend by asset", async () => {
    const fixture = await buildWalletFixture();
    const payer = (owner as any).payer;
    const mintAuthority = payer;
    const mint = await createMint(
      provider.connection,
      payer,
      owner.publicKey,
      null,
      6,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    const walletTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      fixture.walletPda,
      true,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      mint,
      fixture.recipient.publicKey,
      false,
      undefined,
      undefined,
      TOKEN_PROGRAM_ID
    );

    await mintTo(
      provider.connection,
      mintAuthority,
      mint,
      walletTokenAccount.address,
      owner.publicKey,
      5_000_000,
      [],
      undefined,
      TOKEN_PROGRAM_ID
    );

    const transferIx = createTransferCheckedInstruction(
      walletTokenAccount.address,
      mint,
      recipientTokenAccount.address,
      fixture.walletPda,
      1_500_000,
      6,
      [],
      TOKEN_PROGRAM_ID
    );
    const normalizedTransferKeys = normalizeWalletSignedAccounts(
      transferIx.keys,
      fixture.walletPda
    );

    const [assetTrackerPda] = getAssetTrackerPda(fixture.walletPda, mint);
    const requestPda = await nextRequestPda(fixture.walletPda);
    const submitAuditPda = await nextAuditPda(fixture.walletPda);

    await program.methods
      .submitRequest(
        new anchor.BN(1_500_000),
        "spl transfer",
        hashInstructionData(Buffer.from(transferIx.data)),
        hashRemainingAccounts(normalizedTransferKeys),
        null
      )
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        request: requestPda,
        auditEntry: submitAuditPda,
        recipient: recipientTokenAccount.address,
        assetMint: mint,
        assetTracker: assetTrackerPda,
        counterpartyPolicy: null,
        targetProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([fixture.agent])
      .rpc();

    const executeAuditPda = await nextAuditPda(fixture.walletPda);
    await program.methods
      .executeRequestWithPayload(Buffer.from(transferIx.data))
      .accounts({
        agent: fixture.agent.publicKey,
        wallet: fixture.walletPda,
        policy: fixture.policyPda,
        request: requestPda,
        assetTracker: assetTrackerPda,
        auditEntry: executeAuditPda,
        targetProgram: TOKEN_PROGRAM_ID,
        recipient: recipientTokenAccount.address,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts(
        normalizedTransferKeys.map((key) => ({
          pubkey: key.pubkey,
          isSigner: key.isSigner,
          isWritable: key.isWritable,
        }))
      )
      .signers([fixture.agent])
      .rpc();

    const assetTracker = await program.account.assetSpendTracker.fetch(assetTrackerPda);
    const recipientAccount = await getAccount(
      provider.connection,
      recipientTokenAccount.address,
      undefined,
      TOKEN_PROGRAM_ID
    );
    expect(assetTracker.spentInPeriod.toNumber()).to.equal(1_500_000);
    expect(Number(recipientAccount.amount)).to.equal(1_500_000);
  });
});