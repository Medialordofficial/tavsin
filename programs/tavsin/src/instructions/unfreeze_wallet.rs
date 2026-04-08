use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::SmartWallet;

#[derive(Accounts)]
pub struct UnfreezeWallet<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,
}

pub fn handler(ctx: Context<UnfreezeWallet>) -> Result<()> {
    ctx.accounts.wallet.frozen = false;
    msg!("Tavsin wallet UNFROZEN: {}", ctx.accounts.wallet.key());
    Ok(())
}
