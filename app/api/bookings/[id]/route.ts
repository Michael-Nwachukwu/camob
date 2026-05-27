import { NextResponse } from "next/server";
import { getBookingByIdAsync } from "@/lib/services/repository";
import { verifyBookingToken } from "@/lib/booking-tokens";

// Token-gated status probe for guest-facing resume UX (the localStorage pill
// and the booking page). Returns just enough to decide whether to keep showing
// a "complete payment" prompt — never guest PII.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token");

  if (!verifyBookingToken(id, token)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const booking = await getBookingByIdAsync(id);
  if (!booking) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? null,
    paymentMethod: booking.paymentMethod ?? null,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    expiresAt: booking.expiresAt ?? null
  });
}
