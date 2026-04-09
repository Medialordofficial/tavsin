use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::*;

#[derive(Accounts)]
pub struct SubmitRequest<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.agent == agent.key() @ TavsinError::UnauthorizedAgent,
    )]
    pub wallet: Account<'info, SmartWallet>,

    #[account(
        seeds = [POLICY_SEED, wallet.key().as_ref()],
        bump = policy.bump,
    )]
    pub policy: Account<'info, Policy>,

    #[account(
        init,
        payer = agent,
        space = 8 + ExecutionRequest::INIT_SPACE,
        seeds = [REQUEST_SEED, wallet.key().as_ref(), &wallet.next_request_id.to_le_bytes()],
        bump,
    )]
    pub request: Account<'info, ExecutionRequest>,

    #[account(
        init,
        payer = agent,
        space = 8 + AuditEntry::INIT_SPACE,
        seeds = [AUDIT_SEED, wallet.key().as_ref(), &wallet.next_audit_id.to_le_bytes()],
        bump,
    )]
    pub audit_entry: Account<'info, AuditEntry>,

    /// CHECK: Recipient is validated against policy rules and copied into the request.
    pub recipient: UncheckedAccount<'info>,

    /// CHECK: Asset mint is copied into the request and validated against policy.
    pub asset_mint: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = agent,
        space = 8 + AssetSpendTracker::INIT_SPACE,
        seeds = [TRACKER_SEED, wallet.key().as_ref(), asset_mint.key().as_ref()],
        bump,
    )]
    pub asset_tracker: Account<'info, AssetSpendTracker>,

    pub counterparty_policy: Option<Account<'info, CounterpartyPolicy>>,

    /// CHECK: Target program is validated against policy.
    pub target_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SubmitRequest>,
    amount: u64,
    memo: String,
    instruction_hash: [u8; 32],
    accounts_hash: [u8; 32],
    expires_at: Option<i64>,
) -> Result<()> {
    require!(memo.len() <= MAX_MEMO_LENGTH, TavsinError::MemoTooLong);

    let wallet = &mut ctx.accounts.wallet;
    let policy = &ctx.accounts.policy;
    let asset_tracker = &mut ctx.accounts.asset_tracker;
    let request = &mut ctx.accounts.request;
    let audit = &mut ctx.accounts.audit_entry;
    let clock = Clock::get()?;

    let request_id = wallet.next_request_id;
    let recipient_key = ctx.accounts.recipient.key();
    let asset_mint = ctx.accounts.asset_mint.key();
    let target_program = ctx.accounts.target_program.key();
    let resolved_expires_at = expires_at.or(Some(clock.unix_timestamp + DEFAULT_REQUEST_EXPIRY_SECONDS));
    let counterparty_policy = ctx.accounts.counterparty_policy.as_ref();

    if let Some(counterparty) = counterparty_policy {
        require!(
            counterparty.wallet == wallet.key() && counterparty.recipient == recipient_key,
            TavsinError::InvalidCounterpartyPolicy
        );
    }

    if asset_tracker.wallet == Pubkey::default() {
        asset_tracker.wallet = wallet.key();
        asset_tracker.asset_mint = asset_mint;
        asset_tracker.spent_in_period = 0;
        asset_tracker.period_start = clock.unix_timestamp;
        asset_tracker.period_duration = DEFAULT_PERIOD_DURATION;
        asset_tracker.bump = ctx.bumps.asset_tracker;
    } else {
        require!(
            asset_tracker.wallet == wallet.key() && asset_tracker.asset_mint == asset_mint,
            TavsinError::InvalidAssetTracker
        );
    }

    request.wallet = wallet.key();
    request.request_id = request_id;
    request.agent = ctx.accounts.agent.key();
    request.target_program = target_program;
    request.recipient = recipient_key;
    request.asset_mint = asset_mint;
    request.amount = amount;
    request.status = REQUEST_STATUS_PENDING;
    request.instruction_hash = instruction_hash;
    request.accounts_hash = accounts_hash;
    request.memo = memo.clone();
    request.requested_at = clock.unix_timestamp;
    request.expires_at = resolved_expires_at;
    request.reviewed_by = None;
    request.reviewed_at = None;
    request.bump = ctx.bumps.request;

    audit.wallet = wallet.key();
    audit.request_id = request_id;
    audit.approved = false;
    audit.outcome = OUTCOME_DENIED;
    audit.amount = amount;
    audit.asset_mint = asset_mint;
    audit.target_program = target_program;
    audit.recipient = recipient_key;
    audit.denial_reason = REASON_APPROVED;
    audit.memo = memo;
    audit.timestamp = clock.unix_timestamp;
    audit.bump = ctx.bumps.audit_entry;

    if wallet.frozen {
        request.status = REQUEST_STATUS_REJECTED;
        audit.denial_reason = REASON_WALLET_FROZEN;
        wallet.total_denied += 1;
        wallet.next_request_id += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if let Some(expiration) = resolved_expires_at {
        if expiration <= clock.unix_timestamp {
            request.status = REQUEST_STATUS_EXPIRED;
            audit.outcome = OUTCOME_EXPIRED;
            audit.denial_reason = REASON_REQUEST_EXPIRED;
            wallet.total_denied += 1;
            wallet.next_request_id += 1;
            wallet.next_audit_id += 1;
            return Ok(());
        }
    }

    if policy.blocked_mints.contains(&asset_mint) {
        request.status = REQUEST_STATUS_REJECTED;
        audit.denial_reason = REASON_BLOCKED_MINT;
        wallet.total_denied += 1;
        wallet.next_request_id += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if !policy.allowed_programs.is_empty() && !policy.allowed_programs.contains(&target_program) {
        request.status = REQUEST_STATUS_REJECTED;
        audit.denial_reason = REASON_PROGRAM_NOT_ALLOWED;
        wallet.total_denied += 1;
        wallet.next_request_id += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    let active_counterparty = counterparty_policy.filter(|counterparty| counterparty.enabled);
    let recipient_known = policy.allowed_recipients.is_empty()
        || policy.allowed_recipients.contains(&recipient_key)
        || active_counterparty.is_some();
    if !recipient_known {
        if policy.require_approval_for_new_recipients {
            request.status = REQUEST_STATUS_PENDING;
            audit.outcome = OUTCOME_PENDING_APPROVAL;
            audit.denial_reason = REASON_APPROVAL_REQUIRED;
            wallet.total_pending += 1;
            wallet.next_request_id += 1;
            wallet.next_audit_id += 1;
            return Ok(());
        }

        request.status = REQUEST_STATUS_REJECTED;
        audit.denial_reason = REASON_RECIPIENT_NOT_ALLOWED;
        wallet.total_denied += 1;
        wallet.next_request_id += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if let Some(counterparty) = active_counterparty {
        if !counterparty.allowed_mints.is_empty() && !counterparty.allowed_mints.contains(&asset_mint) {
            request.status = REQUEST_STATUS_REJECTED;
            audit.denial_reason = REASON_BLOCKED_MINT;
            wallet.total_denied += 1;
            wallet.next_request_id += 1;
            wallet.next_audit_id += 1;
            return Ok(());
        }
    }

    if let (Some(start), Some(end)) = (policy.time_window_start, policy.time_window_end) {
        let seconds_in_day = clock.unix_timestamp % 86_400;
        if seconds_in_day < start || seconds_in_day > end {
            request.status = REQUEST_STATUS_REJECTED;
            audit.denial_reason = REASON_OUTSIDE_TIME_WINDOW;
            wallet.total_denied += 1;
            wallet.next_request_id += 1;
            wallet.next_audit_id += 1;
            return Ok(());
        }
    }

    let mint_rule = policy.mint_rules.iter().find(|rule| rule.mint == asset_mint);
    let mut max_per_tx = mint_rule.map(|rule| rule.max_per_tx).unwrap_or(policy.max_per_tx);
    let mut max_daily = mint_rule.map(|rule| rule.max_daily).unwrap_or(policy.max_daily);
    let approval_threshold = mint_rule
        .and_then(|rule| rule.require_approval_above)
        .or(policy.approval_threshold);

    if let Some(counterparty) = active_counterparty {
        if let Some(override_max_per_tx) = counterparty.max_per_tx_override {
            max_per_tx = max_per_tx.min(override_max_per_tx);
        }
        if let Some(override_max_daily) = counterparty.daily_limit_override {
            max_daily = max_daily.min(override_max_daily);
        }
    }

    if amount > max_per_tx {
        request.status = REQUEST_STATUS_REJECTED;
        audit.denial_reason = REASON_EXCEEDS_PER_TX;
        wallet.total_denied += 1;
        wallet.next_request_id += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if clock.unix_timestamp >= asset_tracker.period_start + asset_tracker.period_duration {
        asset_tracker.spent_in_period = 0;
        asset_tracker.period_start = clock.unix_timestamp;
    }

    if asset_tracker.spent_in_period + amount > max_daily {
        request.status = REQUEST_STATUS_REJECTED;
        audit.denial_reason = REASON_EXCEEDS_DAILY;
        wallet.total_denied += 1;
        wallet.next_request_id += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if active_counterparty.map(|counterparty| counterparty.require_approval).unwrap_or(false) {
        request.status = REQUEST_STATUS_PENDING;
        audit.outcome = OUTCOME_PENDING_APPROVAL;
        audit.denial_reason = REASON_APPROVAL_REQUIRED;
        wallet.total_pending += 1;
        wallet.next_request_id += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if let Some(threshold) = approval_threshold {
        if amount > threshold {
            request.status = REQUEST_STATUS_PENDING;
            audit.outcome = OUTCOME_PENDING_APPROVAL;
            audit.denial_reason = REASON_APPROVAL_REQUIRED;
            wallet.total_pending += 1;
            wallet.next_request_id += 1;
            wallet.next_audit_id += 1;
            return Ok(());
        }
    }

    request.status = REQUEST_STATUS_APPROVED;
    audit.approved = true;
    audit.outcome = OUTCOME_APPROVED;
    audit.denial_reason = REASON_APPROVED;
    wallet.next_request_id += 1;
    wallet.next_audit_id += 1;

    Ok(())
}