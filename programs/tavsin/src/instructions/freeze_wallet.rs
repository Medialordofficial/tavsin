use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::SmartWallet;

#[derive(Accounts)]
pub struct FreezeWallet<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,
}

pub fn handler(ctx: Context<FreezeWallet>) -> Result<()> {
    ctx.accounts.wallet.frozen = true;
    msg!("Tavsin wallet FROZEN: {}", ctx.accounts.wallet.key());
    Ok(())
}
