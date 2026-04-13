import { NextRequest, NextResponse } from "next/server";

const JUPITER_API =
  process.env.JUPITER_API ?? "https://lite-api.jup.ag/swap/v1";

export async function GET(req: NextRequest) {
  const inputMint = req.nextUrl.searchParams.get("inputMint");
  const outputMint = req.nextUrl.searchParams.get("outputMint");
  const amount = req.nextUrl.searchParams.get("amount");
  const slippageBps = req.nextUrl.searchParams.get("slippageBps") ?? "100";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "inputMint, outputMint, and amount are required" },
      { status: 400 }
    );
  }

  const url = new URL(`${JUPITER_API}/quote`);
  url.searchParams.set("inputMint", inputMint);
  url.searchParams.set("outputMint", outputMint);
  url.searchParams.set("amount", amount);
  url.searchParams.set("slippageBps", slippageBps);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Jupiter quote failed: ${text}` },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
