import { Connection } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { createReadonlyProgram } from "@tavsin/sdk";

import idlJson from "@/lib/tavsin_idl.json";
import { getServerRpcEndpoint, getServerCluster } from "@/lib/network";
import { getServerProgramId } from "@/lib/program-config";

let sharedConnection: Connection | null = null;

export function getReadConnection() {
  if (!sharedConnection) {
    sharedConnection = new Connection(getServerRpcEndpoint(), {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 30_000,
    });
  }

  return sharedConnection;
}

export function getReadonlyProgram() {
  return createReadonlyProgram(
    idlJson as Idl,
    getReadConnection(),
    getServerProgramId()
  );
}

export function getServerHealthContext() {
  return {
    cluster: getServerCluster(),
    rpcEndpoint: getServerRpcEndpoint().replace(/api-key=[^&]+/, "api-key=***"),
    programId: getServerProgramId().toBase58(),
  };
}
