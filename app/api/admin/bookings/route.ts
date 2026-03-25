import { NextResponse } from "next/server";
import { getBookings } from "@/lib/services/repository";

export async function GET() {
  return NextResponse.json({ bookings: getBookings() });
}
