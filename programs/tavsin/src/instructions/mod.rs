pub mod create_wallet;
pub mod execute;
pub mod execute_request;
pub mod freeze_wallet;
pub mod fund_wallet;
pub mod approve_request;
pub mod close_audit_entry;
pub mod close_request;
pub mod panic_drain;
pub mod reject_request;
pub mod rotate_agent;
pub mod shared;
pub mod submit_request;
pub mod unfreeze_wallet;
pub mod update_policy;
pub mod upsert_counterparty_policy;
pub mod withdraw;

// Anchor's `#[program]` macro requires `crate::__client_accounts_*` modules
// generated inside each instruction module to be reachable from the crate
// root. Wildcard re-exports surface those, but they also re-export each
// module's `handler` fn. The compiler warns about ambiguous re-exports of
// `handler`; we silence it because the duplicate names are namespaced under
// `crate::instructions::<mod>::handler` at the call sites in lib.rs.
#[allow(ambiguous_glob_reexports)]
mod reexports {
    pub use super::approve_request::*;
    pub use super::close_audit_entry::*;
    pub use super::close_request::*;
    pub use super::create_wallet::*;
    pub use super::execute::*;
    pub use super::execute_request::*;
    pub use super::freeze_wallet::*;
    pub use super::fund_wallet::*;
    pub use super::panic_drain::*;
    pub use super::reject_request::*;
    pub use super::rotate_agent::*;
    pub use super::shared::*;
    pub use super::submit_request::*;
    pub use super::unfreeze_wallet::*;
    pub use super::update_policy::*;
    pub use super::upsert_counterparty_policy::*;
    pub use super::withdraw::*;
}
pub use reexports::*;
