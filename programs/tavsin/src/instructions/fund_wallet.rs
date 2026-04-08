use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::SmartWallet;

#[derive(Accounts)]
pub struct FundWallet<'info> {
    /// The owner funding the wallet.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The smart wallet PDA to fund.
    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FundWallet>, amount: u64) -> Result<()> {
    // Transfer SOL from owner to the wallet PDA
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            system_program::Transfer {
                from: ctx.accounts.owner.to_account_info(),
                to: ctx.accounts.wallet.to_account_info(),
            },
        ),
        amount,
    )?;

    msg!(
        "Tavsin wallet funded: {} lamports deposited into {}",
        amount,
        ctx.accounts.wallet.key()
    );

    Ok(())
}
