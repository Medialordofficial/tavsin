use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::*;

#[derive(Accounts)]
pub struct Execute<'info> {
    /// The AI agent requesting the transaction.
    #[account(mut)]
    pub agent: Signer<'info>,

    /// The smart wallet PDA (source of funds).
    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.agent == agent.key() @ TavsinError::UnauthorizedAgent,
    )]
    pub wallet: Account<'info, SmartWallet>,

    /// The policy governing this wallet.
    #[account(
        seeds = [POLICY_SEED, wallet.key().as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, Policy>,

    /// The spend tracker for budget enforcement.
    #[account(
        mut,
        seeds = [TRACKER_SEED, wallet.key().as_ref()],
        bump = tracker.bump,
    )]
    pub tracker: Account<'info, SpendTracker>,

    /// The audit entry PDA for this transaction.
    #[account(
        init,
        payer = agent,
        space = 8 + AuditEntry::INIT_SPACE,
        seeds = [
            AUDIT_SEED,
            wallet.key().as_ref(),
            &(wallet.total_approved + wallet.total_denied).to_le_bytes()
        ],
        bump,
    )]
    pub audit_entry: Account<'info, AuditEntry>,

    /// The recipient of the SOL transfer.
    /// CHECK: Can be any account — the policy allowlist checks the target_program, not the recipient.
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,

    /// The target program the agent wants to interact with (for allowlist checking).
    /// CHECK: Validated against the policy allowlist.
    pub target_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Execute>, amount: u64, memo: String) -> Result<()> {
    require!(memo.len() <= 64, TavsinError::MemoTooLong);

    let wallet = &mut ctx.accounts.wallet;
    let policy = &ctx.accounts.policy;
    let tracker = &mut ctx.accounts.tracker;
    let audit = &mut ctx.accounts.audit_entry;
    let clock = Clock::get()?;

    let target_program_key = ctx.accounts.target_program.key();

    // Initialize audit entry fields that are always set
    audit.wallet = wallet.key();
    audit.amount = amount;
    audit.target_program = target_program_key;
    audit.memo = memo;
    audit.timestamp = clock.unix_timestamp;
    audit.bump = ctx.bumps.audit_entry;

    // --- POLICY CHECKS ---

    // Check 1: Wallet frozen?
    if wallet.frozen {
        audit.approved = false;
        audit.denial_reason = REASON_WALLET_FROZEN;
        wallet.total_denied += 1;
        msg!("DENIED: Wallet is frozen");
        return Ok(());
    }

    // Check 2: Per-transaction limit
    if amount > policy.max_per_tx {
        audit.approved = false;
        audit.denial_reason = REASON_EXCEEDS_PER_TX;
        wallet.total_denied += 1;
        msg!(
            "DENIED: Amount {} exceeds per-tx limit {}",
            amount,
            policy.max_per_tx
        );
        return Ok(());
    }

    // Check 3: Daily budget (with period reset)
    // Reset period if expired
    if clock.unix_timestamp >= tracker.period_start + tracker.period_duration {
        tracker.spent_in_period = 0;
        tracker.period_start = clock.unix_timestamp;
    }

    if tracker.spent_in_period + amount > policy.max_daily {
        audit.approved = false;
        audit.denial_reason = REASON_EXCEEDS_DAILY;
        wallet.total_denied += 1;
        msg!(
            "DENIED: Spend {} + {} would exceed daily budget {}",
            tracker.spent_in_period,
            amount,
            policy.max_daily
        );
        return Ok(());
    }

    // Check 4: Program allowlist (empty = allow all)
    if !policy.allowed_programs.is_empty()
        && !policy.allowed_programs.contains(&target_program_key)
    {
        audit.approved = false;
        audit.denial_reason = REASON_PROGRAM_NOT_ALLOWED;
        wallet.total_denied += 1;
        msg!(
            "DENIED: Program {} not on allowlist",
            target_program_key
        );
        return Ok(());
    }

    // Check 5: Time window
    if let (Some(start), Some(end)) = (policy.time_window_start, policy.time_window_end) {
        // Get seconds since midnight UTC
        let seconds_in_day = clock.unix_timestamp % 86_400;
        if seconds_in_day < start || seconds_in_day > end {
            audit.approved = false;
            audit.denial_reason = REASON_OUTSIDE_TIME_WINDOW;
            wallet.total_denied += 1;
            msg!(
                "DENIED: Current time {} outside window [{}, {}]",
                seconds_in_day,
                start,
                end
            );
            return Ok(());
        }
    }

    // --- ALL CHECKS PASSED — EXECUTE TRANSFER ---

    // Transfer SOL from wallet PDA to recipient
    // We cannot use system_program::transfer because the wallet PDA carries data.
    // Instead, directly manipulate lamports (standard pattern for PDA transfers).
    let wallet_lamports = wallet.to_account_info().lamports();
    let rent = Rent::get()?.minimum_balance(wallet.to_account_info().data_len());
    let available = wallet_lamports.saturating_sub(rent);
    require!(available >= amount, TavsinError::InsufficientBalance);

    **wallet.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;

    // Update tracker
    tracker.spent_in_period += amount;

    // Update wallet stats
    wallet.total_approved += 1;

    // Record approval in audit
    audit.approved = true;
    audit.denial_reason = REASON_APPROVED;

    msg!(
        "APPROVED: {} lamports sent to {}. Daily spend: {}/{}",
        amount,
        ctx.accounts.recipient.key(),
        tracker.spent_in_period,
        policy.max_daily
    );

    Ok(())
}
