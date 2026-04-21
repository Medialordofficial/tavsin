use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::*;

#[derive(Accounts)]
pub struct RejectRequest<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,

    #[account(
        mut,
        seeds = [REQUEST_SEED, wallet.key().as_ref(), &request.request_id.to_le_bytes()],
        bump = request.bump,
    )]
    pub request: Account<'info, ExecutionRequest>,

    #[account(
        init,
        payer = owner,
        space = 8 + AuditEntry::INIT_SPACE,
        seeds = [AUDIT_SEED, wallet.key().as_ref(), &wallet.next_audit_id.to_le_bytes()],
        bump,
    )]
    pub audit_entry: Account<'info, AuditEntry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RejectRequest>) -> Result<()> {
    let wallet = &mut ctx.accounts.wallet;
    let request = &mut ctx.accounts.request;
    let audit = &mut ctx.accounts.audit_entry;
    let clock = Clock::get()?;

    if request.status == REQUEST_STATUS_EXECUTED {
        return err!(TavsinError::RequestAlreadyExecuted);
    }
    require!(request.status == REQUEST_STATUS_PENDING, TavsinError::RequestNotPending);

    request.status = REQUEST_STATUS_REJECTED;
    request.reviewed_by = Some(ctx.accounts.owner.key());
    request.reviewed_at = Some(clock.unix_timestamp);

    wallet.total_pending = wallet.total_pending.saturating_sub(1);
    wallet.total_denied += 1;
    wallet.next_audit_id += 1;

    audit.wallet = wallet.key();
    audit.request_id = request.request_id;
    audit.approved = false;
    audit.outcome = OUTCOME_REJECTED_BY_OWNER;
    audit.amount = request.amount;
    audit.asset_mint = request.asset_mint;
    audit.target_program = request.target_program;
    audit.recipient = request.recipient;
    audit.denial_reason = REASON_OWNER_REJECTED;
    audit.memo = request.memo.clone();
    audit.timestamp = clock.unix_timestamp;
    audit.bump = ctx.bumps.audit_entry;

    emit!(RequestRejected {
        wallet: wallet.key(),
        request_id: request.request_id,
        reviewer: ctx.accounts.owner.key(),
        reason: REASON_OWNER_REJECTED,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}