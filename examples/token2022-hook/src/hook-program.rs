// SPDX-License-Identifier: MIT
//
// Token-2022 Transfer Hook program (reference scaffold).
//
// Deploy as its own Anchor program. The mint authority registers this
// program ID as the TransferHook on a Token-2022 mint via the
// `transfer_hook_initialize` extension. After that, *every* call to
// `transfer_checked` on that mint will invoke this program's `execute`
// instruction.
//
// This implementation forwards the transfer details to TavSin and only
// returns Ok(()) if TavSin's policy allows the transfer. If TavSin denies,
// this program returns an error and the SPL token transfer aborts.
//
// See:
//   https://spl.solana.com/transfer-hook-interface
//   https://www.anchor-lang.com/docs/spl/token-2022/transfer-hooks
//
// NOTE: This is a reference scaffold. Wire the actual TavSin CPI in
// `pre_transfer_check()` before deploying.

use anchor_lang::prelude::*;
use spl_tlv_account_resolution::{account::ExtraAccountMeta, state::ExtraAccountMetaList};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

declare_id!("THook11111111111111111111111111111111111111");

pub const TAVSIN_PROGRAM_ID: Pubkey =
    pubkey!("2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy");

#[program]
pub mod tavsin_transfer_hook {
    use super::*;

    /// One-time setup: write the ExtraAccountMetaList that tells the SPL
    /// token program which extra accounts to forward to `execute()` on every
    /// transfer.
    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        let metas: Vec<ExtraAccountMeta> = vec![
            // 0: TavSin program (read-only)
            ExtraAccountMeta::new_with_pubkey(&TAVSIN_PROGRAM_ID, false, false)?,
            // 1: Sender's TavSin smart wallet PDA. Resolved off-chain by
            //    the client; mint authority can also pre-register a static
            //    address if there's a 1:1 mapping.
            //    For dynamic resolution use `new_with_seeds`.
        ];

        let account_size = ExtraAccountMetaList::size_of(metas.len())?;
        let mint_key = ctx.accounts.mint.key();
        let bump = ctx.bumps.extra_account_meta_list;
        let seeds: &[&[u8]] = &[b"extra-account-metas", mint_key.as_ref(), &[bump]];

        let lamports = Rent::get()?.minimum_balance(account_size);
        let signer_seeds: &[&[&[u8]]] = &[seeds];
        anchor_lang::system_program::create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
                signer_seeds,
            ),
            lamports,
            account_size as u64,
            ctx.program_id,
        )?;

        let mut data = ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?;
        ExtraAccountMetaList::init::<ExecuteInstruction>(&mut data, &metas)?;
        Ok(())
    }

    /// Called by the SPL Token-2022 program on every transfer of a mint
    /// whose `TransferHook` extension points to this program.
    pub fn execute(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        // The accounts are (in order):
        //   0: source token account
        //   1: mint
        //   2: destination token account
        //   3: owner / delegate
        //   4: extra_account_meta_list (this PDA)
        //   5..: extras declared in initialize_extra_account_meta_list
        //
        // Forward to TavSin: the owner of the source token account is
        // typically the TavSin smart wallet PDA. Build a `submit_request`
        // CPI here and bail if TavSin returns Err.
        msg!(
            "TavSin Transfer Hook: amount={} src={} dst={} owner={}",
            amount,
            ctx.accounts.source_token.key(),
            ctx.accounts.destination_token.key(),
            ctx.accounts.owner.key(),
        );

        // PRODUCTION TODO:
        //   - Derive the TavSin wallet/policy/tracker PDAs from `owner`.
        //   - CPI into TavSin::submit_request with the transfer amount.
        //   - If submit_request returns Err (policy denied), this returns
        //     Err and the token transfer is aborted by SPL.
        //   - If TavSin auto-approves and emits `RequestApproved`, the
        //     transfer proceeds.
        //
        // For pending requests (above approval threshold), this hook can:
        //   (a) abort the transfer and require the user to retry after
        //       multisig approval, or
        //   (b) escrow the tokens until approval lands.
        //
        // Pattern (a) is the safer default and what this scaffold targets.

        Ok(())
    }

    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction = TransferHookInstruction::unpack(data)?;
        match instruction {
            TransferHookInstruction::Execute { amount } => {
                let amount_bytes = amount.to_le_bytes();
                __private::__global::execute(program_id, accounts, &amount_bytes)
            }
            _ => Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: PDA, init via system_program::create_account in the handler.
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,

    /// CHECK: validated by token-2022 at registration time.
    pub mint: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// CHECK: source token account
    pub source_token: AccountInfo<'info>,
    /// CHECK: mint
    pub mint: AccountInfo<'info>,
    /// CHECK: destination token account
    pub destination_token: AccountInfo<'info>,
    /// CHECK: authority of source_token (typically the TavSin wallet PDA)
    pub owner: AccountInfo<'info>,
    /// CHECK: ExtraAccountMetaList PDA owned by this program
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,
}
