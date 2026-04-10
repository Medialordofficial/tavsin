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
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  try {
    const walletPubkey = new PublicKey(address);
    const page = await fetchAuditEntriesPage(
      getReadonlyProgram(),
      walletPubkey,
      Math.max(0, offset),
      Math.max(1, Math.min(limit, 100))
    );

    return NextResponse.json(serializeAuditEntriesPage(page));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch audit history") },
      { status: 400 }
    );
  }
}
