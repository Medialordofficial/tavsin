# SDK Client Example

This example shows the minimal external-consumer flow for TavSin using the local SDK package:

1. create a program client
2. create a wallet for an agent
3. submit a governed native request
4. fetch wallet detail and audit history

## Typecheck

Run from the repository root:

```bash
npm run typecheck:sample-sdk
```

## Runtime Notes

- The example imports the repo's built IDL from `target/idl/tavsin.json`.
- Use a real signer wallet and a live `Connection` when wiring this into scripts.
- Set a custom program ID when testing against a deployment other than the default devnet/localnet ID.