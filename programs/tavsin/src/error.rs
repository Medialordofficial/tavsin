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
    #[msg("Too many allowed recipients")]
    TooManyAllowedRecipients,
    #[msg("Too many blocked mints")]
    TooManyBlockedMints,
    #[msg("Too many mint rules")]
    TooManyMintRules,
    #[msg("Too many allowed mints for counterparty policy")]
    TooManyCounterpartyMints,
    #[msg("Memo too long (max 64 characters)")]
    MemoTooLong,
    #[msg("Asset mint is blocked by policy")]
    BlockedMint,
    #[msg("Recipient is not allowed by policy")]
    RecipientNotAllowed,
    #[msg("Request requires owner approval")]
    ApprovalRequired,
    #[msg("Request has expired")]
    RequestExpired,
    #[msg("Request is not pending")]
    RequestNotPending,
    #[msg("Request is not approved")]
    RequestNotApproved,
    #[msg("Request has already been executed")]
    RequestAlreadyExecuted,
    #[msg("Execution target is not supported by this instruction")]
    UnsupportedExecutionTarget,
    #[msg("Asset execution path is not supported yet")]
    UnsupportedAssetExecution,
    #[msg("Instruction payload does not match the approved request")]
    RequestInstructionHashMismatch,
    #[msg("Execution accounts do not match the approved request")]
    RequestAccountsHashMismatch,
    #[msg("Counterparty policy account does not match the request recipient")]
    InvalidCounterpartyPolicy,
    #[msg("Asset tracker account does not match the request asset")]
    InvalidAssetTracker,
    #[msg("Execution accounts do not satisfy preflight validation")]
    InvalidExecutionAccounts,
    #[msg("Execution payload does not satisfy preflight validation")]
    InvalidExecutionPayload,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Counterparty policy enforcement is enabled but a matching counterparty account was not provided")]
    CounterpartyPolicyRequired,
    #[msg("Time window bounds must each be in [0, 86400)")]
    InvalidTimeWindow,
    #[msg("Direct execute() is deprecated; use submit_request + execute_request")]
    LegacyExecuteDisabled,
    #[msg("Request is still pending; cancel or resolve it before closing")]
    RequestStillPending,
    #[msg("New agent must differ from the current agent")]
    AgentUnchanged,
}
