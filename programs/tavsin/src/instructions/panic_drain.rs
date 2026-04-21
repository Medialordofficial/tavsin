use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::{PanicDrained, SmartWallet};

/// Emergency kill switch + sweep. The owner pulls every spendable lamport
/// out of the wallet to a recovery destination AND freezes the wallet in the
/// same instruction so a compromised agent cannot race the recovery.
///
/// The wallet PDA itself is preserved (rent-exempt minimum stays in place)
/// so audit history and policy remain queryable post-incident.
#[derive(Accounts)]
pub struct PanicDrain<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Recovery destination. Can be the owner, a Squads vault, a cold wallet,
    /// anything controllable by the owner. Must be a system account.
    /// CHECK: lamports-only transfer, no data inspection.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,
}

pub fn handler(ctx: Context<PanicDrain>) -> Result<()> {
    let rent = Rent::get()?;
    let wallet_info = ctx.accounts.wallet.to_account_info();
    let min_balance = rent.minimum_balance(wallet_info.data_len());

    let current = wallet_info.lamports();
    let sweepable = current.saturating_sub(min_balance);
    require!(sweepable > 0, TavsinError::InsufficientBalance);

    **wallet_info.try_borrow_mut_lamports()? = min_balance;
    **ctx
        .accounts
        .destination
        .to_account_info()
        .try_borrow_mut_lamports()? = ctx
        .accounts
        .destination
        .to_account_info()
        .lamports()
        .checked_add(sweepable)
        .ok_or(TavsinError::ArithmeticOverflow)?;

    // Auto-freeze so the agent cannot transact while the owner reorganizes.
    ctx.accounts.wallet.frozen = true;

    msg!(
        "Tavsin PANIC DRAIN: swept {} lamports from {} to {} and froze the wallet",
        sweepable,
        ctx.accounts.wallet.key(),
        ctx.accounts.destination.key()
    );

    emit!(PanicDrained {
        wallet: ctx.accounts.wallet.key(),
        owner: ctx.accounts.owner.key(),
        destination: ctx.accounts.destination.key(),
        lamports_swept: sweepable,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
