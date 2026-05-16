import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { getBookingsAsync } from "@/lib/services/repository";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  return NextResponse.json({ bookings: await getBookingsAsync() });
}
