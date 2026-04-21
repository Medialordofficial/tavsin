# Security Policy

TavSin is a Solana program that mediates how AI agents spend funds on
behalf of human owners. We treat security as a hard correctness property,
not a feature. We welcome — and reward, when we can — researchers who
help us harden it.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security reports.**

Send a private report to: **security@tavsin.dev**

If you don't have a response within **72 hours**, also DM the maintainer
account on X / Telegram (links in the README) with a reference to your
email so we can prioritize.

Include in your report:

1. A clear description of the issue and its impact.
2. The exact program version (commit SHA + deployed program ID + cluster).
3. Step-by-step reproduction (test, script, or trace).
4. Your recommended fix, if any.
5. Whether you would like public credit when the fix ships.

We commit to:

- Acknowledging the report within **72 hours**.
- Providing an initial impact assessment within **5 business days**.
- Keeping you in the loop on remediation timeline.
- Crediting you (with consent) in the release notes once a fix is shipped.

## Scope

In scope:

- The on-chain program in `programs/tavsin/`.
- The official TypeScript SDK in `sdk/`.
- The reference web app in `app/` (security-sensitive surfaces only:
  authn, request signing, key storage).
- Deployed devnet program ID `2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy`
  (and any future mainnet deployment we publish in the README).

Out of scope:

- Issues that require physical access to a user's device.
- Self-XSS, social engineering, denial of service via rate limits.
- Best-practice complaints without an attack scenario (e.g. "you should
  use a different RPC provider").
- Issues only reproducible against a fork that has materially changed
  the program logic.
- Third-party dependencies — please report those upstream.

## What we consider critical

Anything that lets an actor:

- Move funds from a TavSin smart wallet without satisfying its policy.
- Bypass owner approval for requests above `approval_required_threshold`.
- Spoof an `agent` so policy is evaluated against the wrong identity.
- Defeat `panic_drain`, `freeze_wallet`, or `rotate_agent`.
- Replay an executed request.
- Burn rent / inflate accounts in a way the owner cannot reclaim.
- Cause TavSin to emit false `RequestApproved`/`RequestExecuted` events
  that downstream observers (keepers, audit trails) would trust.

## Disclosure

We follow **coordinated disclosure**:

- We work with the reporter to land a fix.
- We deploy the fix to all clusters we operate.
- We notify known integrators privately.
- After **30 days** (or sooner with the reporter's consent) we publish a
  postmortem in `docs/SECURITY_REVIEW_PREP.md` and the release notes.

## Bug bounty

We do not have a formal bounty program yet. For high-impact issues we
will reward at our discretion (USDC on Solana). Once TavSin has a
mainnet deployment with real TVL, we plan to launch a structured bounty
on Immunefi.

## PGP

A PGP key for `security@tavsin.dev` will be published at
`https://tavsin.dev/.well-known/pgp.asc` once the production domain is
live. Until then, plain email is acceptable — please mark the subject
line `[TAVSIN-SECURITY]`.

## Hall of fame

Researchers who report valid vulnerabilities will be listed here once
fixes ship.

_(no entries yet — be the first)_
