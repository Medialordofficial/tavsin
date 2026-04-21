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

    /// The asset-specific spend tracker for native SOL (Pubkey::default()).
    #[account(
        init_if_needed,
        payer = agent,
        space = 8 + AssetSpendTracker::INIT_SPACE,
        seeds = [TRACKER_SEED, wallet.key().as_ref(), Pubkey::default().as_ref()],
        bump,
    )]
    pub asset_tracker: Account<'info, AssetSpendTracker>,

    /// The audit entry PDA for this transaction.
    #[account(
        init,
        payer = agent,
        space = 8 + AuditEntry::INIT_SPACE,
        seeds = [
            AUDIT_SEED,
            wallet.key().as_ref(),
            &wallet.next_audit_id.to_le_bytes()
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
    let asset_tracker = &mut ctx.accounts.asset_tracker;
    let audit = &mut ctx.accounts.audit_entry;
    let clock = Clock::get()?;

    let target_program_key = ctx.accounts.target_program.key();

    // Initialize asset tracker on first use
    if asset_tracker.wallet == Pubkey::default() {
        asset_tracker.wallet = wallet.key();
        asset_tracker.asset_mint = Pubkey::default();
        asset_tracker.spent_in_period = 0;
        asset_tracker.period_start = clock.unix_timestamp;
        asset_tracker.period_duration = DEFAULT_PERIOD_DURATION;
        asset_tracker.bump = ctx.bumps.asset_tracker;
    }

    // Initialize audit entry fields that are always set
    audit.wallet = wallet.key();
    audit.request_id = LEGACY_DIRECT_REQUEST_ID;
    audit.amount = amount;
    audit.asset_mint = Pubkey::default();
    audit.target_program = target_program_key;
    audit.recipient = ctx.accounts.recipient.key();
    audit.memo = memo;
    audit.timestamp = clock.unix_timestamp;
    audit.bump = ctx.bumps.audit_entry;

    // --- POLICY CHECKS ---

    // Check 1: Wallet frozen?
    if wallet.frozen {
        audit.approved = false;
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_WALLET_FROZEN;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        msg!("DENIED: Wallet is frozen");
        return Ok(());
    }

    // Check 2: Per-transaction limit
    if amount > policy.max_per_tx {
        audit.approved = false;
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_EXCEEDS_PER_TX;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
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
    if clock.unix_timestamp >= asset_tracker.period_start + asset_tracker.period_duration {
        asset_tracker.spent_in_period = 0;
        asset_tracker.period_start = clock.unix_timestamp;
    }

    if tracker.spent_in_period.checked_add(amount).ok_or(TavsinError::ArithmeticOverflow)? > policy.max_daily {
        audit.approved = false;
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_EXCEEDS_DAILY;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
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
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_PROGRAM_NOT_ALLOWED;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        msg!(
            "DENIED: Program {} not on allowlist",
            target_program_key
        );
        return Ok(());
    }

    // C1 fix: enforce recipient allowlist on the legacy direct path. Previously
    // execute() ignored policy.allowed_recipients entirely, allowing a
    // jailbroken agent to drain to any address. SOL = Pubkey::default(); also
    // enforce blocked_mints on the SOL sentinel for parity with submit_request.
    if !policy.allowed_recipients.is_empty()
        && !policy.allowed_recipients.contains(&ctx.accounts.recipient.key())
    {
        audit.approved = false;
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_RECIPIENT_NOT_ALLOWED;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        msg!(
            "DENIED: Recipient {} not on allowlist (legacy execute path)",
            ctx.accounts.recipient.key()
        );
        return Ok(());
    }
    if policy.blocked_mints.contains(&Pubkey::default()) {
        audit.approved = false;
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_BLOCKED_MINT;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        msg!("DENIED: native SOL is blocked by policy");
        return Ok(());
    }
    // C1 fix: the legacy path cannot queue for approval, so refuse to operate
    // when the owner has configured any approval-required policy. This forces
    // those flows through submit_request → execute_request where every check
    // (counterparty, mint_rules, threshold) actually runs.
    if policy.approval_threshold.is_some()
        || policy.require_approval_for_new_recipients
        || !policy.mint_rules.is_empty()
        || policy.enforce_counterparty_policy
    {
        audit.approved = false;
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_UNSUPPORTED_EXECUTION;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        msg!("DENIED: policy requires submit_request → execute_request flow");
        return Ok(());
    }

    // Check 5: Time window
    if let (Some(start), Some(end)) = (policy.time_window_start, policy.time_window_end) {
        let seconds_since_midnight = clock.unix_timestamp.rem_euclid(86_400);
        let in_window = if start <= end {
            seconds_since_midnight >= start && seconds_since_midnight <= end
        } else {
            seconds_since_midnight >= start || seconds_since_midnight <= end
        };
        if !in_window {
            audit.approved = false;
            audit.outcome = OUTCOME_DENIED;
            audit.denial_reason = REASON_OUTSIDE_TIME_WINDOW;
            wallet.total_denied += 1;
            wallet.next_audit_id += 1;
            msg!(
                "DENIED: Current time {} outside window [{}, {}]",
                seconds_since_midnight,
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
    if available < amount {
        audit.approved = false;
        audit.outcome = OUTCOME_DENIED;
        audit.denial_reason = REASON_INSUFFICIENT_BALANCE;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        msg!("DENIED: Wallet has insufficient balance for transfer");
        return Ok(());
    }

    **wallet.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;

    // Update trackers (overflow-checks=true panics on wrap, rolling back)
    tracker.spent_in_period = tracker
        .spent_in_period
        .checked_add(amount)
        .ok_or(TavsinError::ArithmeticOverflow)?;
    asset_tracker.spent_in_period = asset_tracker
        .spent_in_period
        .checked_add(amount)
        .ok_or(TavsinError::ArithmeticOverflow)?;

    // Update wallet stats
    wallet.total_approved += 1;

    // Record approval in audit
    audit.approved = true;
    audit.outcome = OUTCOME_EXECUTED;
    audit.denial_reason = REASON_APPROVED;
    wallet.next_audit_id += 1;

    msg!(
        "APPROVED: {} lamports sent to {}. Daily spend: {}/{}",
        amount,
        ctx.accounts.recipient.key(),
        tracker.spent_in_period,
        policy.max_daily
    );

    Ok(())
}
