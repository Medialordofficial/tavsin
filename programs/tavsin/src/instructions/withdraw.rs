use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,
}

pub fn handler(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let wallet = &ctx.accounts.wallet;

    let rent = Rent::get()?;
    let min_balance = rent.minimum_balance(wallet.to_account_info().data_len());
    let available = wallet
        .to_account_info()
        .lamports()
        .checked_sub(min_balance)
        .unwrap_or(0);

    require!(amount <= available, TavsinError::InsufficientBalance);

    **ctx.accounts.wallet.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += amount;

    msg!(
        "Owner withdrew {} lamports from wallet {}",
        amount,
        ctx.accounts.wallet.key()
    );

    Ok(())
}
