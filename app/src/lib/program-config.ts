import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@tavsin/sdk";

function resolveProgramId(value?: string | null) {
  if (!value) {
    return PROGRAM_ID;
  }

  return new PublicKey(value);
}

export function getPublicProgramId() {
  return resolveProgramId(process.env.NEXT_PUBLIC_TAVSIN_PROGRAM_ID);
}

export function getServerProgramId() {
  return resolveProgramId(
    process.env.TAVSIN_PROGRAM_ID || process.env.NEXT_PUBLIC_TAVSIN_PROGRAM_ID
  );
}
