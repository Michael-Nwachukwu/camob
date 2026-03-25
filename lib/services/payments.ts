import crypto from "node:crypto";
import { env } from "@/lib/env";
import { getBookingById } from "@/lib/services/repository";

export async function initializePaystackPayment(bookingId: string, email: string) {
  const booking = getBookingById(bookingId);
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
      callback_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/booking/success?bookingId=${booking.id}`
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

export function verifyPaystackWebhook(body: string, signature: string | null) {
  if (!env.paystackWebhookSecret || !signature) {
    return false;
  }

  const hash = crypto.createHmac("sha512", env.paystackWebhookSecret).update(body).digest("hex");
  return hash === signature;
}
