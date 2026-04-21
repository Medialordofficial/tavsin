use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::{
    ExecutionRequest, RequestClosed, SmartWallet, REQUEST_STATUS_EXECUTED,
    REQUEST_STATUS_EXPIRED, REQUEST_STATUS_REJECTED,
};

/// Owner-driven cleanup that closes a terminal-state ExecutionRequest PDA and
/// returns the rent (~0.0025 SOL per request) to a recipient of the owner's
/// choosing.
///
/// Pending requests cannot be closed — they must first be approved, rejected,
/// or expired (by passing `expires_at`). Expired requests can also be closed
/// permissionlessly via the same path: anyone can pay the tx fee, but the
/// rent always returns to `rent_recipient` which the OWNER chose.
///
/// The owner can also close a still-pending request that has passed its
/// `expires_at`, marking it expired-by-timeout in the process.
#[derive(Accounts)]
pub struct CloseRequest<'info> {
    pub owner: Signer<'info>,

    /// Where the rent goes. Typically the owner.
    /// CHECK: lamports-only credit.
    #[account(mut)]
    pub rent_recipient: UncheckedAccount<'info>,

    #[account(
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,

    #[account(
        mut,
        close = rent_recipient,
        seeds = [REQUEST_SEED, wallet.key().as_ref(), &request.request_id.to_le_bytes()],
        bump = request.bump,
        constraint = request.wallet == wallet.key() @ TavsinError::InvalidExecutionAccounts,
    )]
    pub request: Account<'info, ExecutionRequest>,
}

pub fn handler(ctx: Context<CloseRequest>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let request = &ctx.accounts.request;

    // Allow close when:
    //   - status is terminal (executed / rejected / expired), OR
    //   - status is anything but the request has hit its expires_at
    let terminal = matches!(
        request.status,
        REQUEST_STATUS_EXECUTED | REQUEST_STATUS_REJECTED | REQUEST_STATUS_EXPIRED
    );
    let timed_out = request
        .expires_at
        .map(|exp| now >= exp)
        .unwrap_or(false);

    require!(terminal || timed_out, TavsinError::RequestStillPending);

    let rent_reclaimed = ctx.accounts.request.to_account_info().lamports();
    let final_status = if terminal {
        request.status
    } else {
        REQUEST_STATUS_EXPIRED
    };

    msg!(
        "Tavsin request closed: id={} wallet={} reclaimed={} lamports",
        request.request_id,
        ctx.accounts.wallet.key(),
        rent_reclaimed,
    );

    emit!(RequestClosed {
        wallet: ctx.accounts.wallet.key(),
        request_id: request.request_id,
        final_status,
        rent_reclaimed,
        timestamp: now,
    });

    Ok(())
}
