import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchCounterpartyPoliciesForWalletPage } from "@tavsin/sdk";

import { serializeCounterpartyPoliciesPage } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadonlyProgram } from "@/lib/server-program";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const { searchParams } = new URL(request.url);
  const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
  const limit = isNaN(rawLimit) ? 100 : Math.max(1, Math.min(rawLimit, 250));
  const search = searchParams.get("search") || undefined;

  try {
    const rl = checkRateLimit(`cp:${getClientIp(request)}`, 60);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const walletPubkey = new PublicKey(address);
    const page = await fetchCounterpartyPoliciesForWalletPage(
      getReadonlyProgram(),
      walletPubkey,
      offset,
      limit,
      search
    );

    const response = NextResponse.json(serializeCounterpartyPoliciesPage(page));
    response.headers.set("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Unable to fetch counterparty policies"),
      },
      { status: 400 }
    );
  }
}
