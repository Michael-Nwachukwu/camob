import { NextResponse } from "next/server";
import { getBookingByIdAsync } from "@/lib/services/repository";
import { sendItineraryEmail } from "@/lib/services/itinerary-email";
import { signBookingId } from "@/lib/booking-tokens";

// Dev-only trigger for the post-payment itinerary email. The real fire-point
// is the Paystack webhook, which requires a signed payload — this lets you
// smoke-test the itinerary path against any existing booking ID without
// spoofing Paystack.
//
// Usage: GET /api/dev/trigger-itinerary?bookingId=<id>
// Returns 404 in production so it's never reachable on a live deploy.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const bookingId = url.searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId query param required" }, { status: 400 });
  }

  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const token = signBookingId(booking.id);
  // The real call is fire-and-forget; for the dev trigger we await so the
  // response carries the outcome.
  try {
    await sendItineraryEmail(booking, token);
    return NextResponse.json({
      ok: true,
      note: "Itinerary attempted. Check /admin/notifications for delivery + AgentRun for the LLM call."
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to send itinerary." },
      { status: 500 }
    );
  }
}
