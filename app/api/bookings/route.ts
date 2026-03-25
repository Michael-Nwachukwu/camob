import { NextResponse } from "next/server";
import { finalizeBooking } from "@/lib/services/booking";
import { sendBookingNotification } from "@/lib/services/notifications";
import { bookingSchema } from "@/lib/validators/booking";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking details." }, { status: 400 });
  }

  try {
    const result = finalizeBooking(parsed.data);
    await sendBookingNotification({
      event: "booking_created",
      guestEmail: result.booking.guest.email,
      guestName: result.booking.guest.fullName,
      bookingId: result.booking.id
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Booking could not be completed." }, { status: 400 });
  }
}
