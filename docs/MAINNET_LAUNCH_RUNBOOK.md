# TavSin Mainnet Launch Runbook

## Scope

This document is the minimum operating procedure for taking TavSin from devnet/localnet into a controlled mainnet-beta release.

## Release Preconditions

- Program binary built from a tagged commit and reproducible locally.
- `npm run test:anchor:skip-build` passing against the current program.
- App production build passing with mainnet environment variables.
- Security review package complete and reviewed internally.
- Upgrade authority owners and freeze decision owners explicitly assigned.

## Environment Matrix

| Surface | Devnet | Mainnet |
|---|---|---|
| Client cluster badge | `NEXT_PUBLIC_SOLANA_CLUSTER=devnet` | `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta` |
| Client RPC | `NEXT_PUBLIC_SOLANA_RPC_URL` | dedicated managed RPC |
| Read API RPC | `TAVSIN_SOLANA_RPC_URL` | separate managed RPC / Helius |
| Program ID | local/devnet deployment | audited mainnet deployment |

## Required Environment Variables

- `NEXT_PUBLIC_SOLANA_CLUSTER`
- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `TAVSIN_SOLANA_CLUSTER`
- `TAVSIN_SOLANA_RPC_URL`
- `HELIUS_API_KEY` when using Helius-managed infrastructure
- `HELIUS_RPC_URL` when reads should route through a managed endpoint

## Deployment Steps

1. Cut a release branch from the audited commit.
2. Build with `anchor build` and record the artifact hash.
3. Run `npm run test:anchor:skip-build` from repo root.
4. Run `npm --prefix app run build` with mainnet env vars.
5. Deploy program with approved upgrade authority wallet.
6. Record deployed program ID, slot, signer, and artifact hash in the release log.
7. Update client and server env vars to the mainnet RPC and program environment.
8. Smoke-test wallet creation, request submission, approval, rejection, and execution on a restricted canary wallet.

## Monitoring Checklist

- RPC latency and error-rate alarms on the read API RPC.
- Next.js route error-rate alarms for:
  - `/api/wallets`
  - `/api/wallets/[address]`
  - `/api/owners/[owner]/pending-requests`
- Wallet queue health:
  - pending approvals rising abnormally
  - repeated request execution failures
  - repeated policy denials by a single agent
- Deployment audit log:
  - release commit
  - deployed binary hash
  - authority wallet
  - rollback target

## Incident Response

### Freeze Procedure

1. Identify affected wallet(s), request IDs, and target program.
2. Owner freezes impacted wallets immediately through the UI or direct instruction.
3. Disable new app traffic if the incident is systemic rather than wallet-specific.
4. Snapshot the failing request payloads and audit records.
5. Escalate to the designated incident owner.

### Rollback Procedure

1. Halt new production deployments.
2. If the issue is app-only, roll back the frontend and keep the program unchanged.
3. If the issue is program-side and upgradeable, deploy the last known-good binary with the recorded artifact hash.
4. Re-run canary wallet smoke tests before reopening traffic.

## Ownership

- Release owner: assign before each launch window.
- Incident commander: assign before each launch window.
- Upgrade authority custodians: document exact signers before mainnet release.

## Post-Launch Review

- Confirm queue, audit, and wallet routes stayed healthy during the first 24 hours.
- Review all rejected and expired requests for unexpected policy behavior.
- Archive release notes, metrics, and any incident timeline for the launch record.