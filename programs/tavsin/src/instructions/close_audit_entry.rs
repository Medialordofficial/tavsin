use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::{AuditEntry, AuditEntryClosed, SmartWallet};

/// Owner-driven cleanup that closes an AuditEntry PDA and refunds its rent
/// (~0.0019 SOL per entry) to a recipient of the owner's choosing.
///
/// AuditEntry rows are most useful in the days immediately after a decision
/// (dispute window, indexer catch-up, dashboard backfill). Once an off-chain
/// indexer has captured the row via the corresponding event, the on-chain
/// copy is redundant and the rent can be reclaimed.
///
/// The owner alone is authorized so that an attacker who compromises the
/// agent cannot wipe inconvenient evidence.
#[derive(Accounts)]
pub struct CloseAuditEntry<'info> {
    pub owner: Signer<'info>,

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
        constraint = audit_entry.wallet == wallet.key() @ TavsinError::InvalidExecutionAccounts,
    )]
    pub audit_entry: Account<'info, AuditEntry>,
}

pub fn handler(ctx: Context<CloseAuditEntry>) -> Result<()> {
    let rent_reclaimed = ctx.accounts.audit_entry.to_account_info().lamports();
    let request_id = ctx.accounts.audit_entry.request_id;

    msg!(
        "Tavsin audit entry closed: request_id={} wallet={} reclaimed={} lamports",
        request_id,
        ctx.accounts.wallet.key(),
        rent_reclaimed,
    );

    emit!(AuditEntryClosed {
        wallet: ctx.accounts.wallet.key(),
        request_id,
        rent_reclaimed,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
