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
    approval_threshold: Option<u64>,
    require_approval_for_new_recipients: Option<bool>,
    allowed_programs: Option<Vec<Pubkey>>,
    allowed_recipients: Option<Vec<Pubkey>>,
    blocked_mints: Option<Vec<Pubkey>>,
    mint_rules: Option<Vec<MintRule>>,
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
    if let Some(val) = approval_threshold {
        policy.approval_threshold = Some(val);
    }
    if let Some(val) = require_approval_for_new_recipients {
        policy.require_approval_for_new_recipients = val;
    }
    if let Some(programs) = allowed_programs {
        require!(
            programs.len() <= MAX_ALLOWED_PROGRAMS,
            TavsinError::TooManyAllowedPrograms
        );
        policy.allowed_programs = programs;
    }
    if let Some(recipients) = allowed_recipients {
        require!(
            recipients.len() <= MAX_ALLOWED_RECIPIENTS,
            TavsinError::TooManyAllowedRecipients
        );
        policy.allowed_recipients = recipients;
    }
    if let Some(mints) = blocked_mints {
        require!(
            mints.len() <= MAX_BLOCKED_MINTS,
            TavsinError::TooManyBlockedMints
        );
        policy.blocked_mints = mints;
    }
    if let Some(rules) = mint_rules {
        require!(rules.len() <= MAX_MINT_RULES, TavsinError::TooManyMintRules);
        policy.mint_rules = rules;
    }
    // For time window: allow explicitly setting to None to clear
    policy.time_window_start = time_window_start;
    policy.time_window_end = time_window_end;

    msg!(
        "Policy updated for wallet {}: max_per_tx={}, max_daily={}, recipients={}, blocked_mints={}",
        ctx.accounts.wallet.key(),
        policy.max_per_tx,
        policy.max_daily,
        policy.allowed_recipients.len(),
        policy.blocked_mints.len()
    );

    Ok(())
}
