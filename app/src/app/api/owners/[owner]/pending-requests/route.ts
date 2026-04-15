import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchPendingApprovalsForOwner } from "@tavsin/sdk";

import { serializePendingApprovalsPage } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadConnection, getReadonlyProgram } from "@/lib/server-program";

export async function GET(
  request: Request,
  context: { params: Promise<{ owner: string }> }
) {
  const { owner } = await context.params;
  const { searchParams } = new URL(request.url);
  const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
  const rawLimit = parseInt(searchParams.get("limit") || "25", 10);
  const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
  const limit = isNaN(rawLimit) ? 25 : Math.max(1, Math.min(rawLimit, 100));

  try {
    const ownerPubkey = new PublicKey(owner);
    const page = await fetchPendingApprovalsForOwner(
      getReadonlyProgram(),
      getReadConnection(),
      ownerPubkey,
      offset,
      limit
    );

    return NextResponse.json(serializePendingApprovalsPage(page));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch pending approvals") },
      { status: 400 }
    );
  }
}
