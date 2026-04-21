import { NextResponse } from "next/server";
import { getReadConnection, getServerHealthContext, getReadonlyProgram } from "@/lib/server-program";

export const dynamic = "force-dynamic";
export const revalidate = 30;

type StatsResponse = {
  status: "ok" | "degraded";
  generatedAt: string;
  slot?: number;
  programId: string;
  cluster: string;
  totals: {
    smartWallets: number;
    activeRequests: number;
    auditEntries: number;
    counterpartyPolicies: number;
    assetTrackers: number;
  };
  error?: string;
};

export async function GET() {
  const ctx = getServerHealthContext();
  const program = getReadonlyProgram();
  const connection = getReadConnection();

  try {
    const accounts = program.account as Record<
      string,
      { all?: () => Promise<unknown[]> } | undefined
    >;
    const safeCount = async (name: string): Promise<number> => {
      try {
        const ns = accounts[name];
        if (!ns?.all) return 0;
        const list = await ns.all();
        return Array.isArray(list) ? list.length : 0;
      } catch {
        return 0;
      }
    };

    const [slot, smartWallets, requests, audits, counterparties, trackers] =
      await Promise.all([
        connection.getSlot("confirmed"),
        safeCount("smartWallet"),
        safeCount("executionRequest"),
        safeCount("auditEntry"),
        safeCount("counterpartyPolicy"),
        safeCount("assetSpendTracker"),
      ]);

    const body: StatsResponse = {
      status: "ok",
      generatedAt: new Date().toISOString(),
      slot,
      programId: ctx.programId,
      cluster: ctx.cluster,
      totals: {
        smartWallets,
        activeRequests: requests,
        auditEntries: audits,
        counterpartyPolicies: counterparties,
        assetTrackers: trackers,
      },
    };

    return NextResponse.json(body, {
      headers: {
        "cache-control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      {
        status: "degraded",
        generatedAt: new Date().toISOString(),
        programId: ctx.programId,
        cluster: ctx.cluster,
        totals: {
          smartWallets: 0,
          activeRequests: 0,
          auditEntries: 0,
          counterpartyPolicies: 0,
          assetTrackers: 0,
        },
        error: message,
      },
      { status: 503 }
    );
  }
}
