# TavSin MCP Server — AI Agent Integration

Plug TavSin into any MCP-compatible AI client (Claude Desktop, Cursor, Continue, etc.) so the AI can natively call governed Solana wallet operations as tools.

## What you get

7 tools exposed via stdio MCP transport:

| Tool | Description |
|---|---|
| `create_wallet` | Create a new policy-governed smart wallet |
| `list_wallets` | List wallets owned by a public key |
| `get_wallet_detail` | Full wallet snapshot (policy, balances, audit) |
| `check_budget` | Remaining daily budget |
| `submit_request` | Submit a spending request (policy-checked on-chain) |
| `get_pending_approvals` | List requests awaiting owner approval |
| `get_audit_log` | Tamper-proof on-chain audit trail |

## Quick start

```bash
cd mcp
npm install
npm run build
```

## Claude Desktop setup

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "tavsin": {
      "command": "node",
      "args": ["/absolute/path/to/tavsin/mcp/dist/index.js"],
      "env": {
        "SOLANA_RPC_URL": "https://api.devnet.solana.com",
        "TAVSIN_AGENT_KEYPAIR": "[1,2,3,...]"
      }
    }
  }
}
```

Restart Claude Desktop. You should see a 🔌 plug icon — click it to confirm `tavsin` is connected with 7 tools.

### Generating an agent keypair

```bash
solana-keygen new --no-bip39-passphrase --silent --outfile /tmp/agent.json
cat /tmp/agent.json   # paste the array into TAVSIN_AGENT_KEYPAIR
solana airdrop 2 $(solana-keygen pubkey /tmp/agent.json) --url devnet
```

## Cursor setup

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "tavsin": {
      "command": "node",
      "args": ["/absolute/path/to/tavsin/mcp/dist/index.js"],
      "env": {
        "SOLANA_RPC_URL": "https://api.devnet.solana.com",
        "TAVSIN_AGENT_KEYPAIR": "[...]"
      }
    }
  }
}
```

## Try it

Once connected, ask Claude:

> "Create a TavSin smart wallet for agent `<pubkey>` with 0.5 SOL per tx limit and 2 SOL daily cap."

> "List all my TavSin wallets."

> "Submit a 0.05 SOL payment from wallet `<wallet>` to `<recipient>` for 'API credits'."

> "Show me the audit log for wallet `<wallet>`."

Claude will call the appropriate tools, TavSin will enforce policy on-chain, and every action is logged in the immutable audit trail.

## Environment variables

| Variable | Required | Default |
|---|---|---|
| `SOLANA_RPC_URL` | no | `https://api.devnet.solana.com` |
| `TAVSIN_AGENT_KEYPAIR` | for write ops | — (JSON array or base58) |

## Read-only mode

If you don't set `TAVSIN_AGENT_KEYPAIR`, the read tools (`list_wallets`, `get_wallet_detail`, `check_budget`, `get_pending_approvals`, `get_audit_log`) still work. Only write tools (`create_wallet`, `submit_request`) require a signing keypair.

## Security

- The MCP server holds the agent keypair in memory — never log or commit it
- All write operations go through TavSin's on-chain policy engine — even if an LLM tries to overspend, the program denies it
- Read operations are stateless and require no authentication

## Beyond MCP — direct LLM tool integrations

If you're building with **Vercel AI SDK**, **Anthropic SDK**, **OpenAI function calling**, or **Solana Agent Kit (SendAI)** directly (no MCP), TavSin ships native tool definitions in `@tavsin/sdk`:

```ts
import { tavsinTools, tavsinToolDefinitions, tavsinSolanaAgentKitPlugin } from "@tavsin/sdk";

// Vercel AI SDK
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const tools = tavsinTools({ program, connection, agentKp });
const result = await generateText({
  model: anthropic("claude-sonnet-4-5"),
  prompt: "Pay merchant ABC 25 USDC for API credits",
  tools,
});

// Anthropic SDK directly
const definitions = tavsinToolDefinitions(); // → JSON-schema tool defs

// Solana Agent Kit (SendAI)
import { SolanaAgentKit } from "solana-agent-kit";
const agent = new SolanaAgentKit(wallet, RPC_URL).use(tavsinSolanaAgentKitPlugin(ctx));
```

One source of truth (`tavsinExecuteTool`), every framework supported.
