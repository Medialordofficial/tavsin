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
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "25", 10);

  try {
    const walletPubkey = new PublicKey(address);
    const page = await fetchRequestsPage(
      getReadonlyProgram(),
      walletPubkey,
      Math.max(0, offset),
      Math.max(1, Math.min(limit, 100))
    );

    return NextResponse.json(serializeRequestsPage(page));
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Unable to fetch request history") },
      { status: 400 }
    );
  }
}
