use anchor_lang::prelude::*;

use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Eq)]
pub struct MintRule {
    /// Asset mint this rule applies to. Native SOL uses Pubkey::default().
    pub mint: Pubkey,
    /// Max amount per transaction for this asset.
    pub max_per_tx: u64,
    /// Max amount per period for this asset.
    pub max_daily: u64,
    /// Optional threshold above which approval is required.
    pub require_approval_above: Option<u64>,
}

/// Smart wallet account — agent funds live here.
/// PDA seeds: [b"wallet", owner.key(), agent.key()]
#[account]
#[derive(InitSpace)]
pub struct SmartWallet {
    /// Account schema version.
    pub version: u8,
    /// The human owner who controls the wallet and policy.
    pub owner: Pubkey,
    /// The AI agent authorized to request transactions.
    pub agent: Pubkey,
    /// Whether the wallet is frozen (kill switch).
    pub frozen: bool,
    /// Bump seed for the PDA.
    pub bump: u8,
    /// Monotonic request nonce.
    pub next_request_id: u64,
    /// Monotonic audit nonce.
    pub next_audit_id: u64,
    /// Total approved transactions.
    pub total_approved: u64,
    /// Total denied transactions.
    pub total_denied: u64,
    /// Total requests awaiting owner action.
    pub total_pending: u64,
    /// Timestamp of wallet creation.
    pub created_at: i64,
}

/// Spending policy tied to a wallet.
/// PDA seeds: [b"policy", wallet.key()]
#[account]
#[derive(InitSpace)]
pub struct Policy {
    /// Account schema version.
    pub version: u8,
    /// The wallet this policy governs.
    pub wallet: Pubkey,
    /// Max lamports/tokens per single transaction.
    pub max_per_tx: u64,
    /// Max lamports/tokens per rolling daily period.
    pub max_daily: u64,
    /// Optional threshold above which requests require owner approval.
    pub approval_threshold: Option<u64>,
    /// Whether new recipients require approval instead of hard denial.
    pub require_approval_for_new_recipients: bool,
    /// Allowed target program IDs (max 10). Empty = allow all.
    #[max_len(MAX_ALLOWED_PROGRAMS)]
    pub allowed_programs: Vec<Pubkey>,
    /// Allowed recipients. Empty = allow all recipients.
    #[max_len(MAX_ALLOWED_RECIPIENTS)]
    pub allowed_recipients: Vec<Pubkey>,
    /// Asset mints that can never be used.
    #[max_len(MAX_BLOCKED_MINTS)]
    pub blocked_mints: Vec<Pubkey>,
    /// Asset-specific rule overrides.
    #[max_len(MAX_MINT_RULES)]
    pub mint_rules: Vec<MintRule>,
    /// Optional: earliest unix timestamp in day the agent can transact (seconds from midnight UTC).
    pub time_window_start: Option<i64>,
    /// Optional: latest unix timestamp in day the agent can transact (seconds from midnight UTC).
    pub time_window_end: Option<i64>,
    /// When true, every submit_request must include a CounterpartyPolicy account
    /// whose PDA matches (wallet, recipient). Closes the C2 bypass where the
    /// agent omits the optional counterparty account to skip its checks.
    pub enforce_counterparty_policy: bool,
    /// Bump seed for the PDA.
    pub bump: u8,
}

/// Tracks cumulative spending for a wallet within a budget period.
/// PDA seeds: [b"tracker", wallet.key()]
#[account]
#[derive(InitSpace)]
pub struct SpendTracker {
    /// The wallet this tracker belongs to.
    pub wallet: Pubkey,
    /// Cumulative spend in the current period.
    pub spent_in_period: u64,
    /// Unix timestamp when the current period started.
    pub period_start: i64,
    /// Period duration in seconds (default: 86400 = 24 hours).
    pub period_duration: i64,
    /// Bump seed.
    pub bump: u8,
}

/// Tracks cumulative spending for a specific asset within a budget period.
/// PDA seeds: [b"tracker", wallet.key(), asset_mint.key()]
#[account]
#[derive(InitSpace)]
pub struct AssetSpendTracker {
    /// The wallet this tracker belongs to.
    pub wallet: Pubkey,
    /// Asset mint this tracker corresponds to. Native SOL uses Pubkey::default().
    pub asset_mint: Pubkey,
    /// Cumulative spend in the current period.
    pub spent_in_period: u64,
    /// Unix timestamp when the current period started.
    pub period_start: i64,
    /// Period duration in seconds.
    pub period_duration: i64,
    /// Bump seed.
    pub bump: u8,
}

/// Recipient-specific policy override.
/// PDA seeds: [b"counterparty", wallet.key(), recipient.key()]
#[account]
#[derive(InitSpace)]
pub struct CounterpartyPolicy {
    /// Wallet this policy belongs to.
    pub wallet: Pubkey,
    /// Recipient covered by this override.
    pub recipient: Pubkey,
    /// Whether the override is enabled.
    pub enabled: bool,
    /// Whether requests to this recipient require approval.
    pub require_approval: bool,
    /// Optional per-tx override.
    pub max_per_tx_override: Option<u64>,
    /// Optional daily limit override.
    pub daily_limit_override: Option<u64>,
    /// Allowed mints for this recipient.
    #[max_len(MAX_COUNTERPARTY_ALLOWED_MINTS)]
    pub allowed_mints: Vec<Pubkey>,
    /// Bump seed.
    pub bump: u8,
}

/// Canonical request account for the agent's intended action.
/// PDA seeds: [b"request", wallet.key(), request_id.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct ExecutionRequest {
    /// Wallet this request belongs to.
    pub wallet: Pubkey,
    /// Monotonic request id.
    pub request_id: u64,
    /// Agent that submitted the request.
    pub agent: Pubkey,
    /// Target program to execute against.
    pub target_program: Pubkey,
    /// Recipient or primary destination.
    pub recipient: Pubkey,
    /// Asset mint for the request. Native SOL uses Pubkey::default().
    pub asset_mint: Pubkey,
    /// Requested amount.
    pub amount: u64,
    /// Request lifecycle state.
    pub status: u8,
    /// Hash of the encoded instruction data.
    pub instruction_hash: [u8; 32],
    /// Hash of the relevant account meta list.
    pub accounts_hash: [u8; 32],
    /// Request memo.
    #[max_len(MAX_MEMO_LENGTH)]
    pub memo: String,
    /// Creation timestamp.
    pub requested_at: i64,
    /// Optional expiration timestamp.
    pub expires_at: Option<i64>,
    /// Reviewer, once approved or rejected.
    pub reviewed_by: Option<Pubkey>,
    /// Review timestamp.
    pub reviewed_at: Option<i64>,
    /// Bump seed.
    pub bump: u8,
}

/// On-chain audit log entry for each transaction decision.
/// PDA seeds: [b"audit", wallet.key(), &total_tx_count.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct AuditEntry {
    /// The wallet this entry belongs to.
    pub wallet: Pubkey,
    /// Request this entry refers to. Legacy direct execution uses `u64::MAX`.
    pub request_id: u64,
    /// Was the transaction approved?
    pub approved: bool,
    /// Outcome enum for richer lifecycle visibility.
    pub outcome: u8,
    /// Amount requested.
    pub amount: u64,
    /// Asset mint for the request. Native SOL uses Pubkey::default().
    pub asset_mint: Pubkey,
    /// Target program the agent wanted to call.
    pub target_program: Pubkey,
    /// Primary destination or recipient.
    pub recipient: Pubkey,
    /// Denial reason (0 = approved, 1 = exceeds per-tx, 2 = exceeds daily, 3 = program not allowed, 4 = outside time window, 5 = wallet frozen).
    pub denial_reason: u8,
    /// Human-readable memo from the agent.
    #[max_len(64)]
    pub memo: String,
    /// Unix timestamp of the decision.
    pub timestamp: i64,
    /// Bump seed.
    pub bump: u8,
}

/// Denial reason codes.
pub const REASON_APPROVED: u8 = 0;
pub const REASON_EXCEEDS_PER_TX: u8 = 1;
pub const REASON_EXCEEDS_DAILY: u8 = 2;
pub const REASON_PROGRAM_NOT_ALLOWED: u8 = 3;
pub const REASON_OUTSIDE_TIME_WINDOW: u8 = 4;
pub const REASON_WALLET_FROZEN: u8 = 5;
pub const REASON_BLOCKED_MINT: u8 = 6;
pub const REASON_RECIPIENT_NOT_ALLOWED: u8 = 7;
pub const REASON_APPROVAL_REQUIRED: u8 = 8;
pub const REASON_OWNER_REJECTED: u8 = 9;
pub const REASON_INSUFFICIENT_BALANCE: u8 = 10;
pub const REASON_REQUEST_EXPIRED: u8 = 11;
pub const REASON_UNSUPPORTED_EXECUTION: u8 = 12;

/// Audit outcome codes.
pub const OUTCOME_APPROVED: u8 = 0;
pub const OUTCOME_DENIED: u8 = 1;
pub const OUTCOME_PENDING_APPROVAL: u8 = 2;
pub const OUTCOME_REJECTED_BY_OWNER: u8 = 3;
pub const OUTCOME_EXECUTED: u8 = 4;
pub const OUTCOME_EXPIRED: u8 = 5;

/// Request status codes.
pub const REQUEST_STATUS_PENDING: u8 = 0;
pub const REQUEST_STATUS_APPROVED: u8 = 1;
pub const REQUEST_STATUS_REJECTED: u8 = 2;
pub const REQUEST_STATUS_EXECUTED: u8 = 3;
pub const REQUEST_STATUS_EXPIRED: u8 = 4;

// ============================================================================
// Events — emitted on every state transition so indexers/dashboards can
// subscribe in real-time instead of polling AuditEntry PDAs.
// ============================================================================

#[event]
pub struct WalletCreated {
    pub wallet: Pubkey,
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub max_per_tx: u64,
    pub max_daily: u64,
    pub timestamp: i64,
}

#[event]
pub struct PolicyUpdated {
    pub wallet: Pubkey,
    pub owner: Pubkey,
    pub max_per_tx: u64,
    pub max_daily: u64,
    pub timestamp: i64,
}

#[event]
pub struct RequestSubmitted {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub agent: Pubkey,
    pub recipient: Pubkey,
    pub asset_mint: Pubkey,
    pub amount: u64,
    pub status: u8,
    pub timestamp: i64,
}

#[event]
pub struct RequestApproved {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub reviewer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct RequestRejected {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub reviewer: Pubkey,
    pub reason: u8,
    pub timestamp: i64,
}

#[event]
pub struct RequestExecuted {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub recipient: Pubkey,
    pub asset_mint: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct RequestDenied {
    pub wallet: Pubkey,
    pub request_id: u64,
    pub reason: u8,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct WalletFrozen {
    pub wallet: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct WalletUnfrozen {
    pub wallet: Pubkey,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CounterpartyPolicyUpserted {
    pub wallet: Pubkey,
    pub recipient: Pubkey,
    pub enabled: bool,
    pub require_approval: bool,
    pub timestamp: i64,
}
