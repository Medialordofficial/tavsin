use anchor_lang::prelude::*;

#[error_code]
pub enum TavsinError {
    #[msg("Transaction amount exceeds per-transaction limit")]
    ExceedsPerTxLimit,
    #[msg("Transaction would exceed daily budget")]
    ExceedsDailyBudget,
    #[msg("Target program is not on the allowlist")]
    ProgramNotAllowed,
    #[msg("Transaction is outside the allowed time window")]
    OutsideTimeWindow,
    #[msg("Wallet is frozen")]
    WalletFrozen,
    #[msg("Unauthorized: only the wallet owner can perform this action")]
    Unauthorized,
    #[msg("Unauthorized agent: caller is not the authorized agent")]
    UnauthorizedAgent,
    #[msg("Insufficient wallet balance")]
    InsufficientBalance,
    #[msg("Too many allowed programs (max 10)")]
    TooManyAllowedPrograms,
    #[msg("Memo too long (max 64 characters)")]
    MemoTooLong,
}
