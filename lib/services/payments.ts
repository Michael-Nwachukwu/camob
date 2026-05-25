import crypto from "node:crypto";
import { env } from "@/lib/env";
import { getBookingByIdAsync } from "@/lib/services/repository";
import { signBookingId } from "@/lib/booking-tokens";

export async function initializePaystackPayment(bookingId: string, email: string) {
  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!env.paystackSecretKey) {
    return {
      provider: "demo",
      reference: booking.paymentReference,
      authorizationUrl: null
    };
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      amount: booking.total * 100,
      reference: booking.paymentReference,
      metadata: {
        bookingId: booking.id,
        apartmentTypeId: booking.apartmentTypeId
      },
      callback_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/booking/success?bookingId=${booking.id}&token=${signBookingId(booking.id)}`
    })
  });

  if (!response.ok) {
    throw new Error("Unable to initialize Paystack payment");
  }

  const payload = await response.json();
  return {
    provider: "paystack",
    reference: payload.data.reference as string,
    authorizationUrl: payload.data.authorization_url as string
  };
}

export async function refundPaystackPayment(reference: string, amountNaira: number) {
  if (!env.paystackSecretKey) {
    // Dev / no-keys mode: pretend it worked so the admin flow stays usable.
    return { provider: "demo" as const, refunded: false, reason: "no-secret" };
  }

  const response = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transaction: reference,
      amount: amountNaira * 100
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Paystack refund failed (${response.status}): ${detail}`);
  }

  const payload = await response.json();
  return { provider: "paystack" as const, refunded: true, data: payload.data };
}

export function verifyPaystackWebhook(body: string, signature: string | null) {
  // Use `||`, not `??`: an empty PAYSTACK_WEBHOOK_SECRET ("") must fall back to
  // the secret key (Paystack signs webhooks with the secret key). `??` would
  // keep the empty string and reject every webhook.
  const secret = env.paystackWebhookSecret || env.paystackSecretKey;

  if (!secret || !signature) {
    return false;
  }

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature;
}
