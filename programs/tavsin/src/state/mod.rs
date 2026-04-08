use anchor_lang::prelude::*;

/// The maximum number of allowed programs per policy.
pub const MAX_ALLOWED_PROGRAMS: usize = 10;

/// Smart wallet account — agent funds live here.
/// PDA seeds: [b"wallet", owner.key(), agent.key()]
#[account]
#[derive(InitSpace)]
pub struct SmartWallet {
    /// The human owner who controls the wallet and policy.
    pub owner: Pubkey,
    /// The AI agent authorized to request transactions.
    pub agent: Pubkey,
    /// Whether the wallet is frozen (kill switch).
    pub frozen: bool,
    /// Bump seed for the PDA.
    pub bump: u8,
    /// Total approved transactions.
    pub total_approved: u64,
    /// Total denied transactions.
    pub total_denied: u64,
    /// Timestamp of wallet creation.
    pub created_at: i64,
}

/// Spending policy tied to a wallet.
/// PDA seeds: [b"policy", wallet.key()]
#[account]
#[derive(InitSpace)]
pub struct Policy {
    /// The wallet this policy governs.
    pub wallet: Pubkey,
    /// Max lamports/tokens per single transaction.
    pub max_per_tx: u64,
    /// Max lamports/tokens per rolling daily period.
    pub max_daily: u64,
    /// Allowed target program IDs (max 10). Empty = allow all.
    #[max_len(MAX_ALLOWED_PROGRAMS)]
    pub allowed_programs: Vec<Pubkey>,
    /// Optional: earliest unix timestamp in day the agent can transact (seconds from midnight UTC).
    pub time_window_start: Option<i64>,
    /// Optional: latest unix timestamp in day the agent can transact (seconds from midnight UTC).
    pub time_window_end: Option<i64>,
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

/// On-chain audit log entry for each transaction decision.
/// PDA seeds: [b"audit", wallet.key(), &total_tx_count.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct AuditEntry {
    /// The wallet this entry belongs to.
    pub wallet: Pubkey,
    /// Was the transaction approved?
    pub approved: bool,
    /// Amount requested.
    pub amount: u64,
    /// Target program the agent wanted to call.
    pub target_program: Pubkey,
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
