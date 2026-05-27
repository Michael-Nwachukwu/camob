import { NextResponse } from "next/server";
import { initializePaystackPayment } from "@/lib/services/payments";
import { paystackInitializeSchema } from "@/lib/validators/booking";
import { verifyBookingToken } from "@/lib/booking-tokens";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = paystackInitializeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment initialization request." }, { status: 400 });
  }

  if (!verifyBookingToken(parsed.data.bookingId, parsed.data.token)) {
    return NextResponse.json({ error: "This payment link isn't valid." }, { status: 403 });
  }

  try {
    const payload = await initializePaystackPayment(parsed.data.bookingId);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to initialize payment." }, { status: 400 });
  }
}
