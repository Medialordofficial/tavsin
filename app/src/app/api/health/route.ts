import { NextResponse } from "next/server";
import { getReadConnection, getServerHealthContext } from "@/lib/server-program";

export async function GET() {
  const context = getServerHealthContext();

  try {
    const connection = getReadConnection();
    const slot = await connection.getSlot();

    return NextResponse.json({
      status: "ok",
      slot,
      ...context,
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        ...context,
      },
      { status: 503 }
    );
  }
}
