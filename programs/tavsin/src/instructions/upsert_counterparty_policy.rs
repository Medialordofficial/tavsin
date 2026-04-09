use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::*;

#[derive(Accounts)]
pub struct UpsertCounterpartyPolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,

    /// CHECK: Used only as a PDA seed and stored pubkey.
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + CounterpartyPolicy::INIT_SPACE,
        seeds = [COUNTERPARTY_SEED, wallet.key().as_ref(), recipient.key().as_ref()],
        bump,
    )]
    pub counterparty_policy: Account<'info, CounterpartyPolicy>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<UpsertCounterpartyPolicy>,
    enabled: bool,
    require_approval: bool,
    max_per_tx_override: Option<u64>,
    daily_limit_override: Option<u64>,
    allowed_mints: Vec<Pubkey>,
) -> Result<()> {
    require!(
        allowed_mints.len() <= MAX_COUNTERPARTY_ALLOWED_MINTS,
        TavsinError::TooManyCounterpartyMints
    );

    let policy = &mut ctx.accounts.counterparty_policy;
    policy.wallet = ctx.accounts.wallet.key();
    policy.recipient = ctx.accounts.recipient.key();
    policy.enabled = enabled;
    policy.require_approval = require_approval;
    policy.max_per_tx_override = max_per_tx_override;
    policy.daily_limit_override = daily_limit_override;
    policy.allowed_mints = allowed_mints;
    policy.bump = ctx.bumps.counterparty_policy;

    msg!(
        "Counterparty policy upserted for wallet {} recipient {}",
        policy.wallet,
        policy.recipient
    );

    Ok(())
}