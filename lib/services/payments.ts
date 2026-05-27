import crypto from "node:crypto";
import { env } from "@/lib/env";
import { getBookingByIdAsync, updateBookingAsync } from "@/lib/services/repository";
import { signBookingId } from "@/lib/booking-tokens";

export async function initializePaystackPayment(bookingId: string) {
  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Email is always derived from the persisted booking, never trusted from the
  // client — the resume flow only carries an id + signed token.
  const email = booking.guest.email;

  if (!env.paystackSecretKey) {
    return {
      provider: "demo",
      reference: booking.paymentReference,
      authorizationUrl: null
    };
  }

  // Paystack rejects a reference it has already seen, so the resume flow can't
  // replay the original. Mint a fresh one per initialize and persist it, so the
  // webhook's reference match still lines up with whatever Paystack reports.
  const reference = `CAMOB_${crypto.randomUUID()}`;
  await updateBookingAsync(bookingId, { paymentReference: reference });

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      amount: booking.total * 100,
      reference,
      metadata: {
        bookingId: booking.id,
        apartmentTypeId: booking.apartmentTypeId
      },
      callback_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/booking/success?bookingId=${booking.id}&token=${signBookingId(booking.id)}`
    })
  });

  // Paystack signals some failures with HTTP 200 + `status:false`, so check the
  // body too — and surface its message instead of a generic one so the real
  // reason (bad key, duplicate reference, etc.) is visible to the caller.
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status || !payload?.data?.authorization_url) {
    const detail = payload?.message ?? `HTTP ${response.status}`;
    throw new Error(`Unable to initialize Paystack payment: ${String(detail).slice(0, 300)}`);
  }

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
