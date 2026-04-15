import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchWalletDetail } from "@tavsin/sdk";

import { serializeWalletDetail } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadConnection, getReadonlyProgram } from "@/lib/server-program";

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const { searchParams } = new URL(request.url);
  const rawMax = parseInt(searchParams.get("limit") || "50", 10);
  const maxEntries = isNaN(rawMax) ? 50 : Math.max(1, Math.min(rawMax, 100));

  try {
    const walletPubkey = new PublicKey(address);
    const detail = await fetchWalletDetail(
      getReadonlyProgram(),
      getReadConnection(),
      walletPubkey,
      maxEntries
    );

    return NextResponse.json(serializeWalletDetail(detail));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch wallet detail") },
      { status: 400 }
    );
  }
}
