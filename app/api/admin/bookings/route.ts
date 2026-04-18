import { NextResponse } from "next/server";
import { getBookingsAsync } from "@/lib/services/repository";

export async function GET() {
  return NextResponse.json({ bookings: await getBookingsAsync() });
}
