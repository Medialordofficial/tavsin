import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchRequestsPage } from "@tavsin/sdk";

import { serializeRequestsPage } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadonlyProgram } from "@/lib/server-program";

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const { searchParams } = new URL(request.url);
  const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "25", 10);
  const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
  const limit = isNaN(rawLimit) ? 25 : Math.max(1, Math.min(rawLimit, 100));

  try {
    const walletPubkey = new PublicKey(address);
    const page = await fetchRequestsPage(
      getReadonlyProgram(),
      walletPubkey,
      offset,
      limit
    );

    return NextResponse.json(serializeRequestsPage(page));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch request history") },
      { status: 400 }
    );
  }
}
