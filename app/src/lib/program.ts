import { Connection } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

// IDL import
import idlJson from "./tavsin_idl.json";
import { createProgram } from "@tavsin/sdk";

export * from "@tavsin/sdk";

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  return createProgram(idlJson as any, connection, wallet);
}

export { getLegacyTrackerPda as getTrackerPda } from "@tavsin/sdk";
