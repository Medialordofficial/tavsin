import { NextRequest, NextResponse } from "next/server";

const JUPITER_API =
  process.env.JUPITER_API ?? "https://lite-api.jup.ag/swap/v1";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { quoteResponse, userPublicKey } = body;

  if (!quoteResponse || !userPublicKey) {
    return NextResponse.json(
      { error: "quoteResponse and userPublicKey are required" },
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
