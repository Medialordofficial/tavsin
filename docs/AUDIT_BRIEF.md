# TavSin — Security Audit Engagement Brief

**Prepared for:** External security review firms
**Protocol:** TavSin — policy-enforced smart wallet for AI agents on Solana
**Date:** April 10, 2026

---

## 1. What We're Asking For

A focused security review of the TavSin Solana program (Anchor/Rust). The scope is a single program deployed on mainnet-beta for the first time.

**Desired timeline:** 1–2 week turnaround (expedited review).

---

## 2. Protocol Summary

TavSin is a smart wallet where agent funds live inside PDAs owned by the TavSin program. When an AI agent wants to spend, it submits a request to the program. The program evaluates on-chain policy rules (per-tx limits, daily budgets, program allowlists, token blocklists, counterparty controls, time windows, approval thresholds). If approved, TavSin signs with the PDA's authority and CPI-invokes the target program. If violated, the transaction is rejected and logged.

The agent never holds keys. It cannot bypass the policy.

---

## 3. Scope

| Surface | Description |
|---|---|
| **Program** | `programs/tavsin/` — single Anchor program (~12 instructions) |
| **Language** | Rust (Anchor framework v1.0) |
| **Network** | Solana mainnet-beta |
| **LOC (program)** | ~2,000 lines Rust |
| **Test suite** | 11 integration tests (Anchor + legacy validator) |
| **SDK** | TypeScript — `sdk/` (read-only, no signing authority) |
| **Frontend** | Next.js dashboard (out of scope for program review) |

### In-Scope Instructions

| Instruction | Risk Level | Notes |
|---|---|---|
| `create_wallet` | Medium | PDA derivation, initial policy setup |
| `submit_request` | **Critical** | Policy enforcement, escalation logic |
| `approve_request` | **Critical** | Owner-only, binds to instruction hash |
| `reject_request` | High | Owner-only, state transition |
| `execute_request` | **Critical** | CPI invoke_signed, hash verification |
| `execute_request_with_payload` | **Critical** | CPI with arbitrary instruction data |
| `update_policy` | High | Owner-only mutation, list management |
| `upsert_counterparty_policy` | High | Recipient-specific narrowing |
| `freeze_wallet` / `unfreeze_wallet` | Medium | Owner-only lifecycle |
| `withdraw` | High | Owner-only fund extraction |

---

## 4. Threat Model (Key Concerns)

1. **Request replay** — Can an executed/rejected/expired request be re-executed?
2. **Payload substitution** — Can approved instruction hashes differ from executed ones?
3. **Signer escalation** — Can accounts be reordered to make the wallet PDA a signer in unintended contexts?
4. **Budget bypass** — Can native and SPL spend trackers be circumvented?
5. **Counterparty bypass** — Can blocked/restricted recipients be reached through alternate token accounts?
6. **Policy mutation** — Can a non-owner modify policy or counterparty rules?
7. **Freeze bypass** — Can a frozen wallet still execute requests?

---

## 5. What We Provide

- Full repository access (private GitHub invite)
- Audited commit SHA: `74d2326baffe85389d724f6397f6a31cffc46c03`
- Program binary hash: `6deafd3d442bbaa6186b2cd36db31fe8bcc89fb1bf4326085252128e65ebd22d`
- Program ID: `2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy`
- Passing test suite (11/11)
- Build commands: `anchor build`, `npm run test:anchor:skip-build`
- Detailed threat model in `SECURITY_REVIEW_PREP.md`
- Known limitations and trust assumptions documented

---

## 6. Severity Model

| Severity | Definition |
|---|---|
| Critical | Funds loss, approval bypass, arbitrary PDA signing, permanent lockup |
| High | Policy bypass under realistic conditions, privilege escalation, replay, incorrect spend accounting |
| Medium | Denial-of-service, confusing lifecycle behavior, broken operator guarantees |
| Low | Documentation gaps, monitoring blind spots, non-exploitable inconsistencies |

---

## 7. Budget & Engagement

We are seeking quotes from:
- **OtterSec** — Solana-native, worked with Squads/Marinade/Jupiter
- **Neodyme** — Deep Solana BPF expertise
- **Halborn** — Broad smart contract audit practice
- **Trail of Bits** — Top-tier, cross-chain

**Budget range:** $15,000–$50,000 depending on scope and timeline.

**Contact:** [YOUR EMAIL] / [YOUR TELEGRAM]

---

## 8. Engagement Checklist

- [ ] NDA signed (if required)
- [ ] GitHub repo access granted
- [ ] Kick-off call scheduled
- [ ] Reviewer confirms commit SHA and build reproducibility
- [ ] Review period begins
- [ ] Draft report delivered
- [ ] Remediation commits submitted
- [ ] Re-test of fixed findings
- [ ] Final report delivered
- [ ] No open Critical or High findings at sign-off
