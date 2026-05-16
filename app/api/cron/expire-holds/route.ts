import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { expireStaleHolds } from "@/lib/services/holds";
import { hasDatabase } from "@/lib/services/repository";

// Vercel Cron hits this endpoint with `Authorization: Bearer <CRON_SECRET>`.
// In dev we leave it open so it can be triggered manually.
async function handle(request: Request) {
  if (env.cronSecret) {
    const provided = request.headers.get("authorization");
    if (provided !== `Bearer ${env.cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!hasDatabase()) {
    return NextResponse.json({ ok: true, expired: 0, skipped: "no-database" });
  }

  const expired = await expireStaleHolds();
  return NextResponse.json({ ok: true, expired });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
