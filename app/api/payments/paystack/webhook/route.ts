import { NextResponse } from "next/server";
import { confirmBookingPaymentAsync } from "@/lib/services/booking";
import { getBookingByIdAsync } from "@/lib/services/repository";
import { sendBookingNotification } from "@/lib/services/notifications";
import { verifyPaystackWebhook } from "@/lib/services/payments";
import type { PaystackWebhookEvent } from "@/lib/types";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as PaystackWebhookEvent;
  if (payload.event !== "charge.success") {
    return NextResponse.json({ ok: true });
  }

  const bookingId = String(payload.data.metadata?.bookingId ?? "");
  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.paymentStatus === "paid" && booking.paymentReference === payload.data.reference) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const confirmed = await confirmBookingPaymentAsync(booking.id, payload.data.reference);
  await sendBookingNotification({
    event: "payment_confirmed",
    guestEmail: confirmed.guest.email,
    guestName: confirmed.guest.fullName,
    bookingId: confirmed.id
  });

  return NextResponse.json({ ok: true });
}
