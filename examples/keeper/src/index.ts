/**
 * TavSin Keeper Bot — minimal reference implementation.
 *
 * Watches for RequestApproved events on the TavSin program and immediately
 * lands execute_request on-chain.
 *
 * Run:
 *   KEEPER_KEYPAIR=~/.config/solana/id.json \
 *   RPC_URL=https://api.devnet.solana.com \
 *   npm run start
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  AnchorProvider,
  BorshCoder,
  EventParser,
  Program,
  Wallet,
  type Idl,
} from "@coral-xyz/anchor";

const __dirname = dirname(fileURLToPath(import.meta.url));
const idl = JSON.parse(
  readFileSync(resolve(__dirname, "../../../target/idl/tavsin.json"), "utf8")
) as Idl;

const PROGRAM_ID = new PublicKey(
  process.env.TAVSIN_PROGRAM_ID ??
    "2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy"
);

function loadKeypair(path: string): Keypair {
  const expanded = path.startsWith("~/")
    ? path.replace("~", process.env.HOME ?? "")
    : path;
  const raw = JSON.parse(readFileSync(expanded, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

interface ApprovedEvent {
  wallet: PublicKey;
  request: PublicKey;
  requestId: bigint;
}

async function executeRequest(
  program: Program<Idl>,
  approved: ApprovedEvent
): Promise<string | null> {
  // Load the request account to learn the rent_recipient + agent expected by
  // the execute_request handler. The TavSin SDK exposes builders for this in
  // production deployments; here we keep it self-contained.
  const requestAccount = await program.account["request"]!.fetchNullable(
    approved.request
  );
  if (!requestAccount) {
    console.warn(`[keeper] request ${approved.request.toBase58()} not found`);
    return null;
  }

  // execute_request requires: wallet, request, agent (signer), rent_recipient,
  // plus the remaining accounts encoded in the request's payload hash. A
  // production keeper reconstructs those from the original transfer payload
  // (cached at submit time) or from an off-chain DB.
  //
  // For demo purposes we log the intent. Wire the full ix builder in your
  // deployment using @tavsin/sdk's request payload helpers.
  console.log(
    `[keeper] would execute request ${approved.request.toBase58()} (id=${approved.requestId}) for wallet ${approved.wallet.toBase58()}`
  );
  return null;
}

async function main() {
  const rpc = process.env.RPC_URL ?? "https://api.devnet.solana.com";
  const wsRpc = rpc.replace(/^http/, "ws");
  const keeper = loadKeypair(
    process.env.KEEPER_KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`
  );

  const connection = new Connection(rpc, {
    commitment: "confirmed",
    wsEndpoint: wsRpc,
  });
  const wallet = new Wallet(keeper);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(
    { ...idl, address: PROGRAM_ID.toBase58() },
    provider
  );
  const parser = new EventParser(PROGRAM_ID, new BorshCoder(idl));

  console.log(`[keeper] starting; program=${PROGRAM_ID.toBase58()}`);
  console.log(`[keeper] keeper pubkey=${keeper.publicKey.toBase58()}`);
  console.log(`[keeper] rpc=${rpc}`);

  const inflight = new Set<string>();

  connection.onLogs(
    PROGRAM_ID,
    async (logs) => {
      if (!logs.logs?.length) return;
      try {
        for (const evt of parser.parseLogs(logs.logs)) {
          if (evt.name !== "RequestApproved") continue;
          const data = evt.data as unknown as {
            wallet: PublicKey;
            request: PublicKey;
            request_id?: bigint;
            requestId?: bigint;
          };
          const reqKey = data.request.toBase58();
          if (inflight.has(reqKey)) continue;
          inflight.add(reqKey);

          const approved: ApprovedEvent = {
            wallet: data.wallet,
            request: data.request,
            requestId: data.requestId ?? data.request_id ?? 0n,
          };

          executeRequest(program, approved)
            .then((sig) => {
              if (sig) console.log(`[keeper] landed ${reqKey} in ${sig}`);
            })
            .catch((err) => {
              console.error(`[keeper] execute failed for ${reqKey}:`, err);
            })
            .finally(() => inflight.delete(reqKey));
        }
      } catch (err) {
        // EventParser raises when logs contain non-anchor noise; ignore.
      }
    },
    "confirmed"
  );

  // Keep the process alive.
  process.on("SIGINT", () => {
    console.log("\n[keeper] shutting down");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[keeper] fatal:", err);
  process.exit(1);
});
