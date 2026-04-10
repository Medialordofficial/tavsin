# TavSin Pre-Launch Checklist

This checklist maps each launch gate from `FULL_LAUNCH_PLAN.md` to concrete repository evidence and the remaining blocker, if any.

## Gate Status

| Launch gate | Status | Evidence | Remaining blocker |
|---|---|---|---|
| Governed execution exists for real CPI and token flows | Implemented | `programs/tavsin/src/lib.rs`, `tests/tavsin-requests.ts`, `tests/tavsin-spl.ts` | None in repo |
| Policy checks bind to the executed instruction | Implemented | `programs/tavsin/src/instructions/shared.rs`, `tests/tavsin-requests.ts` | None in repo |
| Approval-required requests enforced on-chain | Implemented | `programs/tavsin/src/lib.rs`, `tests/tavsin-requests.ts` | None in repo |
| Token-aware controls and per-asset tracking exist | Implemented | `programs/tavsin/src/state/mod.rs`, `tests/tavsin-spl.ts` | None in repo |
| Counterparty controls exist beyond program allowlists | Implemented | `programs/tavsin/src/lib.rs`, `app/src/app/wallet/[address]/page.tsx` | None in repo |
| Frontend consumes the SDK | Implemented | `app/src/lib/program.ts`, `sdk/src/index.ts`, all app imports use `@tavsin/sdk` directly | None |
| Wallet, audit, request, and policy reads are scalable | Implemented | `app/src/app/api/**`, `sdk/src/queries.ts`, paginated dashboard/wallet views, `scripts/validate-reads.ts` | Run with managed RPC before launch |
| Tests are reproducible from a clean machine | Implemented | `package.json`, `Anchor.toml`, `README.md` | None in repo |
| Security review completed and findings closed | Ready for review | `SECURITY_REVIEW_PREP.md` (evidence captured, threat model, known limitations, trust assumptions documented) | External review engagement and remediation loop |
| Mainnet deployment, monitoring, and rollback documented | Implemented | `MAINNET_LAUNCH_RUNBOOK.md`, `.env.mainnet.example`, `Anchor.toml`, `app/src/app/api/health/route.ts` | Authority assignments, deployed monitoring dashboards |

## Pre-Testing Exit Criteria

- `anchor build` passes.
- `npm run test:anchor:skip-build` passes.
- `npm --prefix app run lint` passes.
- `npm --prefix app run build` passes.
- `npm run typecheck:sample-sdk` passes.

## Pre-Mainnet Exit Criteria

- Mainnet program ID is finalized and set in `.env.mainnet.example`-style deployment config.
- Release owner, incident commander, and upgrade-authority custodians are assigned.
- Managed RPC / indexed reads are load-tested.
- External security review is complete and launch-blocking findings are closed.
- A canary release has exercised wallet creation, request submission, approval, rejection, and execution with production-like monitoring enabled.