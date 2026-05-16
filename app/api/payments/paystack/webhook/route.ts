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

  let payload: PaystackWebhookEvent;
  try {
    payload = JSON.parse(rawBody) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook body." }, { status: 400 });
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ ok: true });
  }

  if (payload.data?.status !== "success") {
    return NextResponse.json({ ok: true, ignored: "non-success status" });
  }

  const bookingId = String(payload.data.metadata?.bookingId ?? "");
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId metadata." }, { status: 400 });
  }

  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // Verify the reference Paystack reports matches the one we issued.
  if (booking.paymentReference && booking.paymentReference !== payload.data.reference) {
    return NextResponse.json({ error: "Reference mismatch." }, { status: 400 });
  }

  // Verify Paystack-reported amount matches what we expect (kobo).
  const expectedAmountKobo = booking.total * 100;
  if (typeof payload.data.amount !== "number" || payload.data.amount < expectedAmountKobo) {
    return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
  }

  // Idempotent: if already paid with this reference, no-op.
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
