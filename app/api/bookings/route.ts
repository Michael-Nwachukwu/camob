import { NextResponse } from "next/server";
import { finalizeBookingAsync } from "@/lib/services/booking";
import { sendBookingNotification } from "@/lib/services/notifications";
import { bookingSchema } from "@/lib/validators/booking";
import { signBookingId } from "@/lib/booking-tokens";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking details." }, { status: 400 });
  }

  try {
    const result = await finalizeBookingAsync(parsed.data);
    const token = signBookingId(result.booking.id);
    await sendBookingNotification({
      event: "booking_created",
      booking: result.booking,
      token
    });
    return NextResponse.json({ ...result, token });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Booking could not be completed." }, { status: 400 });
  }
}
