import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchWalletsForOwnerPage } from "@tavsin/sdk";

import { serializeWalletsPage } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadConnection, getReadonlyProgram } from "@/lib/server-program";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const rl = checkRateLimit(`wallets:${getClientIp(request)}`, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "24", 10);
  const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
  const limit = isNaN(rawLimit) ? 24 : Math.max(1, Math.min(rawLimit, 100));

  if (!owner) {
    return NextResponse.json({ error: "owner is required" }, { status: 400 });
  }

  try {
    const ownerPubkey = new PublicKey(owner);
    const page = await fetchWalletsForOwnerPage(
      getReadonlyProgram(),
      getReadConnection(),
      ownerPubkey,
      offset,
      limit
    );

    const response = NextResponse.json(serializeWalletsPage(page));
    response.headers.set("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch wallets") },
      { status: 400 }
    );
  }
}
