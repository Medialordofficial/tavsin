import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchAuditEntriesPage } from "@tavsin/sdk";

import { serializeAuditEntriesPage } from "@/lib/api-models";
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
    const page = await fetchAuditEntriesPage(
      getReadonlyProgram(),
      walletPubkey,
      offset,
      limit
    );

    return NextResponse.json(serializeAuditEntriesPage(page));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch audit history") },
      { status: 400 }
    );
  }
}
