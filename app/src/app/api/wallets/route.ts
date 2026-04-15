import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchWalletsForOwnerPage } from "@tavsin/sdk";

import { serializeWalletsPage } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadConnection, getReadonlyProgram } from "@/lib/server-program";

export async function GET(request: Request) {
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

    return NextResponse.json(serializeWalletsPage(page));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch wallets") },
      { status: 400 }
    );
  }
}
