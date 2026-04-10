import { Connection } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

import idlJson from "./tavsin_idl.json";
import { createProgram } from "@tavsin/sdk";
import { getPublicProgramId } from "@/lib/program-config";

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  return createProgram(
    idlJson as Idl,
    connection,
    wallet,
    getPublicProgramId()
  );
}
