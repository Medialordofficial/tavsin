use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::TavsinError;
use crate::state::{AgentRotated, SmartWallet};

/// Owner-controlled key rotation for the wallet's authorized agent.
///
/// Use case: an agent's private key is suspected leaked. The owner rotates to
/// a fresh keypair without re-creating the wallet, preserving policy, audit
/// history, and the wallet PDA itself.
///
/// Note: the wallet PDA is seeded by `(owner, original agent)`, so rotating
/// does NOT change the PDA. Future signers must use the new agent key.
#[derive(Accounts)]
pub struct RotateAgent<'info> {
    pub owner: Signer<'info>,

    /// CHECK: validated by the wallet's `agent` field after the swap; we only
    /// need its pubkey, no data is read or written here.
    pub new_agent: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [WALLET_SEED, wallet.owner.as_ref(), wallet.agent.as_ref()],
        bump = wallet.bump,
        constraint = wallet.owner == owner.key() @ TavsinError::Unauthorized,
    )]
    pub wallet: Account<'info, SmartWallet>,
}

pub fn handler(ctx: Context<RotateAgent>) -> Result<()> {
    let wallet = &mut ctx.accounts.wallet;
    let new_agent = ctx.accounts.new_agent.key();

    require_keys_neq!(new_agent, wallet.agent, TavsinError::AgentUnchanged);

    let previous_agent = wallet.agent;
    wallet.agent = new_agent;

    msg!(
        "Tavsin agent rotated on wallet {}: {} -> {}",
        wallet.key(),
        previous_agent,
        new_agent
    );

    emit!(AgentRotated {
        wallet: wallet.key(),
        owner: ctx.accounts.owner.key(),
        previous_agent,
        new_agent,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
