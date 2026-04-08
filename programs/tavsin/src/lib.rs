pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy");

#[program]
pub mod tavsin {
    use super::*;

    pub fn create_wallet(
        ctx: Context<CreateWallet>,
        max_per_tx: u64,
        max_daily: u64,
        allowed_programs: Vec<Pubkey>,
        time_window_start: Option<i64>,
        time_window_end: Option<i64>,
    ) -> Result<()> {
        instructions::create_wallet::handler(
            ctx,
            max_per_tx,
            max_daily,
            allowed_programs,
            time_window_start,
            time_window_end,
        )
    }

    pub fn fund_wallet(ctx: Context<FundWallet>, amount: u64) -> Result<()> {
        instructions::fund_wallet::handler(ctx, amount)
    }

    pub fn execute(
        ctx: Context<Execute>,
        amount: u64,
        memo: String,
    ) -> Result<()> {
        instructions::execute::handler(ctx, amount, memo)
    }

    pub fn freeze_wallet(ctx: Context<FreezeWallet>) -> Result<()> {
        instructions::freeze_wallet::handler(ctx)
    }

    pub fn unfreeze_wallet(ctx: Context<UnfreezeWallet>) -> Result<()> {
        instructions::unfreeze_wallet::handler(ctx)
    }

    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        max_per_tx: Option<u64>,
        max_daily: Option<u64>,
        allowed_programs: Option<Vec<Pubkey>>,
        time_window_start: Option<i64>,
        time_window_end: Option<i64>,
    ) -> Result<()> {
        instructions::update_policy::handler(
            ctx,
            max_per_tx,
            max_daily,
            allowed_programs,
            time_window_start,
            time_window_end,
        )
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }
}
