import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runWeeklyBrief } from "@/lib/services/weekly-brief";

// Weekly market-positioning brief. Triggered by Vercel Cron (vercel.json) or
// the docker `cron-weekly` sidecar with `Authorization: Bearer <CRON_SECRET>`.
// Same auth shape as expire-holds — open in dev for manual triggering.
async function handle(request: Request) {
  if (env.cronSecret) {
    const provided = request.headers.get("authorization");
    if (provided !== `Bearer ${env.cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runWeeklyBrief();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "weekly brief failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
