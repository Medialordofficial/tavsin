import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

const JUPITER_API =
  process.env.JUPITER_API ?? "https://lite-api.jup.ag/swap/v1";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { quoteResponse, userPublicKey } = body as Record<string, unknown>;

  if (!quoteResponse || !userPublicKey) {
    return NextResponse.json(
      { error: "quoteResponse and userPublicKey are required" },
      { status: 400 }
    );
  }

  try {
    new PublicKey(userPublicKey as string);
  } catch {
    return NextResponse.json(
      { error: "Invalid userPublicKey" },
      { status: 400 }
    );
  }

  const res = await fetch(`${JUPITER_API}/swap-instructions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Jupiter swap-instructions failed: ${text}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
