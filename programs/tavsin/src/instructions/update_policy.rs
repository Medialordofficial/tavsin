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
    clear_time_window: Option<bool>,
    enforce_counterparty_policy: Option<bool>,
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
    // H1 fix: time-window updates are now opt-in. Pass clear_time_window=Some(true)
    // to explicitly null both ends. Otherwise, only update the side(s) explicitly
    // provided. Previously a partial policy update silently wiped the window.
    if clear_time_window.unwrap_or(false) {
        policy.time_window_start = None;
        policy.time_window_end = None;
    } else {
        if let Some(val) = time_window_start {
            require!((0..86_400).contains(&val), TavsinError::InvalidTimeWindow);
            policy.time_window_start = Some(val);
        }
        if let Some(val) = time_window_end {
            require!((0..86_400).contains(&val), TavsinError::InvalidTimeWindow);
            policy.time_window_end = Some(val);
        }
    }
    if let Some(flag) = enforce_counterparty_policy {
        policy.enforce_counterparty_policy = flag;
    }

    msg!(
        "Policy updated for wallet {}: max_per_tx={}, max_daily={}, recipients={}, blocked_mints={}",
        ctx.accounts.wallet.key(),
        policy.max_per_tx,
        policy.max_daily,
        policy.allowed_recipients.len(),
        policy.blocked_mints.len()
    );

    emit!(PolicyUpdated {
        wallet: ctx.accounts.wallet.key(),
        owner: ctx.accounts.owner.key(),
        max_per_tx: policy.max_per_tx,
        max_daily: policy.max_daily,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
