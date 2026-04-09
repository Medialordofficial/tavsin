use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::instructions::shared::{
    invoke_wallet_signed,
    validate_execution_preflight,
    verify_request_payload,
};
use crate::state::*;

#[derive(Accounts)]
pub struct ExecuteRequest<'info> {
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
        init_if_needed,
        payer = agent,
        space = 8 + AssetSpendTracker::INIT_SPACE,
        seeds = [TRACKER_SEED, wallet.key().as_ref(), request.asset_mint.as_ref()],
        bump,
    )]
    pub asset_tracker: Account<'info, AssetSpendTracker>,

    #[account(
        mut,
        seeds = [REQUEST_SEED, wallet.key().as_ref(), &request.request_id.to_le_bytes()],
        bump = request.bump,
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

    /// CHECK: Checked against the request target program.
    pub target_program: UncheckedAccount<'info>,

    /// CHECK: Recipient is constrained to the request recipient.
    #[account(mut, constraint = recipient.key() == request.recipient)]
    pub recipient: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExecuteRequest>, instruction_data: Vec<u8>) -> Result<()> {
    let expected_instruction_hash = ctx.accounts.request.instruction_hash;
    let expected_accounts_hash = ctx.accounts.request.accounts_hash;

    verify_request_payload(
        expected_instruction_hash,
        expected_accounts_hash,
        &instruction_data,
        ctx.remaining_accounts,
    )?;

    let wallet = &mut ctx.accounts.wallet;
    let policy = &ctx.accounts.policy;
    let asset_tracker = &mut ctx.accounts.asset_tracker;
    let request = &mut ctx.accounts.request;
    let audit = &mut ctx.accounts.audit_entry;
    let clock = Clock::get()?;

    if asset_tracker.wallet == Pubkey::default() {
        asset_tracker.wallet = wallet.key();
        asset_tracker.asset_mint = request.asset_mint;
        asset_tracker.spent_in_period = 0;
        asset_tracker.period_start = clock.unix_timestamp;
        asset_tracker.period_duration = DEFAULT_PERIOD_DURATION;
        asset_tracker.bump = ctx.bumps.asset_tracker;
    } else {
        require!(
            asset_tracker.wallet == wallet.key() && asset_tracker.asset_mint == request.asset_mint,
            TavsinError::InvalidAssetTracker
        );
    }

    if request.status == REQUEST_STATUS_EXECUTED {
        return err!(TavsinError::RequestAlreadyExecuted);
    }
    require!(request.status == REQUEST_STATUS_APPROVED, TavsinError::RequestNotApproved);
    require!(
        ctx.accounts.target_program.key() == request.target_program,
        TavsinError::UnsupportedExecutionTarget
    );

    let use_native_direct_path = validate_execution_preflight(
        wallet.key(),
        request,
        ctx.remaining_accounts,
        &instruction_data,
    )?;

    audit.wallet = wallet.key();
    audit.request_id = request.request_id;
    audit.approved = false;
    audit.outcome = OUTCOME_DENIED;
    audit.amount = request.amount;
    audit.asset_mint = request.asset_mint;
    audit.target_program = request.target_program;
    audit.recipient = request.recipient;
    audit.denial_reason = REASON_APPROVED;
    audit.memo = request.memo.clone();
    audit.timestamp = clock.unix_timestamp;
    audit.bump = ctx.bumps.audit_entry;

    if wallet.frozen {
        audit.denial_reason = REASON_WALLET_FROZEN;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if let Some(expires_at) = request.expires_at {
        if clock.unix_timestamp > expires_at {
            request.status = REQUEST_STATUS_EXPIRED;
            audit.outcome = OUTCOME_EXPIRED;
            audit.denial_reason = REASON_REQUEST_EXPIRED;
            wallet.total_denied += 1;
            wallet.next_audit_id += 1;
            return Ok(());
        }
    }

    if clock.unix_timestamp >= asset_tracker.period_start + asset_tracker.period_duration {
        asset_tracker.spent_in_period = 0;
        asset_tracker.period_start = clock.unix_timestamp;
    }

    let mint_rule = policy.mint_rules.iter().find(|rule| rule.mint == request.asset_mint);
    let max_daily = mint_rule.map(|rule| rule.max_daily).unwrap_or(policy.max_daily);

    if asset_tracker.spent_in_period + request.amount > max_daily {
        audit.denial_reason = REASON_EXCEEDS_DAILY;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    let wallet_lamports = wallet.to_account_info().lamports();
    let rent = Rent::get()?.minimum_balance(wallet.to_account_info().data_len());
    let available = wallet_lamports.saturating_sub(rent);
    if available < request.amount {
        audit.denial_reason = REASON_INSUFFICIENT_BALANCE;
        wallet.total_denied += 1;
        wallet.next_audit_id += 1;
        return Ok(());
    }

    if use_native_direct_path {
        **wallet.to_account_info().try_borrow_mut_lamports()? -= request.amount;
        **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += request.amount;
    } else {
        let wallet_key = wallet.key();
        let wallet_owner = wallet.owner;
        let wallet_agent = wallet.agent;
        let wallet_bump = wallet.bump;
        invoke_wallet_signed(
            wallet_key,
            wallet_owner,
            wallet_agent,
            wallet_bump,
            request.target_program,
            ctx.remaining_accounts,
            instruction_data,
        )
        .map_err(|_| error!(TavsinError::UnsupportedExecutionTarget))?;
    }

    asset_tracker.spent_in_period += request.amount;
    request.status = REQUEST_STATUS_EXECUTED;
    wallet.total_approved += 1;
    wallet.next_audit_id += 1;

    audit.approved = true;
    audit.outcome = OUTCOME_EXECUTED;

    Ok(())
}