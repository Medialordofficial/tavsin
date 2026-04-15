import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchWalletDetail } from "@tavsin/sdk";

import { serializeWalletDetail } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadConnection, getReadonlyProgram } from "@/lib/server-program";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const { searchParams } = new URL(request.url);
  const rawMax = parseInt(searchParams.get("limit") || "50", 10);
  const maxEntries = isNaN(rawMax) ? 50 : Math.max(1, Math.min(rawMax, 100));

  try {
    const rl = checkRateLimit(`wd:${getClientIp(request)}`, 60);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const walletPubkey = new PublicKey(address);
    const detail = await fetchWalletDetail(
      getReadonlyProgram(),
      getReadConnection(),
      walletPubkey,
      maxEntries
    );

    const response = NextResponse.json(serializeWalletDetail(detail));
    response.headers.set("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch wallet detail") },
      { status: 400 }
    );
  }
}
