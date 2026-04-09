use anchor_lang::prelude::*;

#[constant]
/// Seed prefixes for PDAs.
pub const WALLET_SEED: &[u8] = b"wallet";
pub const POLICY_SEED: &[u8] = b"policy";
pub const TRACKER_SEED: &[u8] = b"tracker";
pub const AUDIT_SEED: &[u8] = b"audit";
pub const REQUEST_SEED: &[u8] = b"request";
pub const COUNTERPARTY_SEED: &[u8] = b"counterparty";

/// Default budget period: 24 hours in seconds.
pub const DEFAULT_PERIOD_DURATION: i64 = 86_400;
pub const DEFAULT_REQUEST_EXPIRY_SECONDS: i64 = 900;

pub const WALLET_VERSION: u8 = 2;
pub const POLICY_VERSION: u8 = 2;

pub const MAX_ALLOWED_PROGRAMS: usize = 10;
pub const MAX_ALLOWED_RECIPIENTS: usize = 20;
pub const MAX_BLOCKED_MINTS: usize = 20;
pub const MAX_MINT_RULES: usize = 12;
pub const MAX_COUNTERPARTY_ALLOWED_MINTS: usize = 12;
pub const MAX_MEMO_LENGTH: usize = 64;

pub const LEGACY_DIRECT_REQUEST_ID: u64 = u64::MAX;
