use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::*;

#[derive(Accounts)]
pub struct CreateWallet<'info> {
    /// The human owner creating the wallet.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The agent's public key (not a signer — just an identifier).
    /// CHECK: This is just used as a PDA seed, not accessed.
    pub agent: UncheckedAccount<'info>,

    /// The smart wallet PDA.
    #[account(
        init,
        payer = owner,
        space = 8 + SmartWallet::INIT_SPACE,
        seeds = [WALLET_SEED, owner.key().as_ref(), agent.key().as_ref()],
        bump,
    )]
    pub wallet: Account<'info, SmartWallet>,

    /// The policy PDA tied to this wallet.
    #[account(
        init,
        payer = owner,
        space = 8 + Policy::INIT_SPACE,
        seeds = [POLICY_SEED, wallet.key().as_ref()],
        bump,
    )]
    pub policy: Account<'info, Policy>,

    /// The spend tracker PDA tied to this wallet.
    #[account(
        init,
        payer = owner,
        space = 8 + SpendTracker::INIT_SPACE,
        seeds = [TRACKER_SEED, wallet.key().as_ref()],
        bump,
    )]
    pub tracker: Account<'info, SpendTracker>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateWallet>,
    max_per_tx: u64,
    max_daily: u64,
    allowed_programs: Vec<Pubkey>,
    time_window_start: Option<i64>,
    time_window_end: Option<i64>,
) -> Result<()> {
    require!(
        allowed_programs.len() <= MAX_ALLOWED_PROGRAMS,
        TavsinError::TooManyAllowedPrograms
    );

    let clock = Clock::get()?;

    // Initialize wallet
    let wallet = &mut ctx.accounts.wallet;
    wallet.version = WALLET_VERSION;
    wallet.owner = ctx.accounts.owner.key();
    wallet.agent = ctx.accounts.agent.key();
    wallet.frozen = false;
    wallet.bump = ctx.bumps.wallet;
    wallet.next_request_id = 0;
    wallet.next_audit_id = 0;
    wallet.total_approved = 0;
    wallet.total_denied = 0;
    wallet.total_pending = 0;
    wallet.created_at = clock.unix_timestamp;

    // Initialize policy
    let policy = &mut ctx.accounts.policy;
    policy.version = POLICY_VERSION;
    policy.wallet = wallet.key();
    policy.max_per_tx = max_per_tx;
    policy.max_daily = max_daily;
    policy.approval_threshold = None;
    policy.require_approval_for_new_recipients = false;
    policy.allowed_programs = allowed_programs;
    policy.allowed_recipients = Vec::new();
    policy.blocked_mints = Vec::new();
    policy.mint_rules = Vec::new();
    policy.time_window_start = time_window_start;
    policy.time_window_end = time_window_end;
    policy.bump = ctx.bumps.policy;

    // Initialize spend tracker
    let tracker = &mut ctx.accounts.tracker;
    tracker.wallet = wallet.key();
    tracker.spent_in_period = 0;
    tracker.period_start = clock.unix_timestamp;
    tracker.period_duration = DEFAULT_PERIOD_DURATION;
    tracker.bump = ctx.bumps.tracker;

    msg!(
        "Tavsin wallet created: owner={}, agent={}, max_per_tx={}, max_daily={}",
        wallet.owner,
        wallet.agent,
        policy.max_per_tx,
        policy.max_daily
    );

    Ok(())
}
