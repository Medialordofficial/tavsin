use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    pub owner: Signer<'info>,

    #[account(
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,

    #[account(
        mut,
        seeds = [POLICY_SEED, wallet.key().as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, Policy>,
}

pub fn handler(
    ctx: Context<UpdatePolicy>,
    max_per_tx: Option<u64>,
    max_daily: Option<u64>,
    allowed_programs: Option<Vec<Pubkey>>,
    time_window_start: Option<i64>,
    time_window_end: Option<i64>,
) -> Result<()> {
    let policy = &mut ctx.accounts.policy;

    if let Some(val) = max_per_tx {
        policy.max_per_tx = val;
    }
    if let Some(val) = max_daily {
        policy.max_daily = val;
    }
    if let Some(programs) = allowed_programs {
        require!(
            programs.len() <= MAX_ALLOWED_PROGRAMS,
            TavsinError::TooManyAllowedPrograms
        );
        policy.allowed_programs = programs;
    }
    // For time window: allow explicitly setting to None to clear
    policy.time_window_start = time_window_start;
    policy.time_window_end = time_window_end;

    msg!(
        "Policy updated for wallet {}: max_per_tx={}, max_daily={}",
        ctx.accounts.wallet.key(),
        policy.max_per_tx,
        policy.max_daily
    );

    Ok(())
}
