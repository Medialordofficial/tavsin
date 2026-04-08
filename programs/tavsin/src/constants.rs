use anchor_lang::prelude::*;

#[constant]
/// Seed prefixes for PDAs.
pub const WALLET_SEED: &[u8] = b"wallet";
pub const POLICY_SEED: &[u8] = b"policy";
pub const TRACKER_SEED: &[u8] = b"tracker";
pub const AUDIT_SEED: &[u8] = b"audit";

/// Default budget period: 24 hours in seconds.
pub const DEFAULT_PERIOD_DURATION: i64 = 86_400;
