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

    pub fn submit_request(
        ctx: Context<SubmitRequest>,
        amount: u64,
        memo: String,
        instruction_hash: [u8; 32],
        accounts_hash: [u8; 32],
        expires_at: Option<i64>,
    ) -> Result<()> {
        instructions::submit_request::handler(
            ctx,
            amount,
            memo,
            instruction_hash,
            accounts_hash,
            expires_at,
        )
    }

    pub fn approve_request(ctx: Context<ApproveRequest>) -> Result<()> {
        instructions::approve_request::handler(ctx)
    }

    pub fn reject_request(ctx: Context<RejectRequest>) -> Result<()> {
        instructions::reject_request::handler(ctx)
    }

    pub fn execute_request(ctx: Context<ExecuteRequest>) -> Result<()> {
        instructions::execute_request::handler(ctx, Vec::new())
    }

    pub fn execute_request_with_payload(
        ctx: Context<ExecuteRequest>,
        instruction_data: Vec<u8>,
    ) -> Result<()> {
        instructions::execute_request::handler(ctx, instruction_data)
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
        approval_threshold: Option<u64>,
        require_approval_for_new_recipients: Option<bool>,
        allowed_programs: Option<Vec<Pubkey>>,
        allowed_recipients: Option<Vec<Pubkey>>,
        blocked_mints: Option<Vec<Pubkey>>,
        mint_rules: Option<Vec<MintRule>>,
        time_window_start: Option<i64>,
        time_window_end: Option<i64>,
    ) -> Result<()> {
        instructions::update_policy::handler(
            ctx,
            max_per_tx,
            max_daily,
            approval_threshold,
            require_approval_for_new_recipients,
            allowed_programs,
            allowed_recipients,
            blocked_mints,
            mint_rules,
            time_window_start,
            time_window_end,
        )
    }

    pub fn upsert_counterparty_policy(
        ctx: Context<UpsertCounterpartyPolicy>,
        enabled: bool,
        require_approval: bool,
        max_per_tx_override: Option<u64>,
        daily_limit_override: Option<u64>,
        allowed_mints: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::upsert_counterparty_policy::handler(
            ctx,
            enabled,
            require_approval,
            max_per_tx_override,
            daily_limit_override,
            allowed_mints,
        )
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }
}
