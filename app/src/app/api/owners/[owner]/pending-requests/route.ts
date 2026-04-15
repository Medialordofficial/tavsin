import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchPendingApprovalsForOwner } from "@tavsin/sdk";

import { serializePendingApprovalsPage } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadConnection, getReadonlyProgram } from "@/lib/server-program";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    const rl = checkRateLimit(`pend:${getClientIp(request)}`, 60);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const ownerPubkey = new PublicKey(owner);
    const page = await fetchPendingApprovalsForOwner(
      getReadonlyProgram(),
      getReadConnection(),
      ownerPubkey,
      offset,
      limit
    );

    const response = NextResponse.json(serializePendingApprovalsPage(page));
    response.headers.set("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
    return response;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch pending approvals") },
      { status: 400 }
    );
  }
}
