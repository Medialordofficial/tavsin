import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { fetchCounterpartyPoliciesForWalletPage } from "@tavsin/sdk";

import { serializeCounterpartyPoliciesPage } from "@/lib/api-models";
import { getErrorMessage } from "@/lib/errors";
import { getReadonlyProgram } from "@/lib/server-program";

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const search = searchParams.get("search") || undefined;

  try {
    const walletPubkey = new PublicKey(address);
    const page = await fetchCounterpartyPoliciesForWalletPage(
      getReadonlyProgram(),
      walletPubkey,
      Math.max(0, offset),
      Math.max(1, Math.min(limit, 250)),
      search
    );

    return NextResponse.json(serializeCounterpartyPoliciesPage(page));
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Unable to fetch counterparty policies"),
      },
      { status: 400 }
    );
  }
}
