import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getSiteCopy } from "@/lib/services/repository";

async function logNotification(params: {
  event: "booking_created" | "payment_confirmed";
  recipients: string[];
  payload: Record<string, unknown>;
}) {
  if (!env.databaseUrl || params.recipients.length === 0) {
    return;
  }

  try {
    await prisma.notificationLog.createMany({
      data: params.recipients.map((recipient) => ({
        channel: "email",
        event: params.event,
        recipient,
        payload: params.payload as Prisma.InputJsonValue
      }))
    });
  } catch {
    return;
  }
}

export async function sendBookingNotification(params: {
  event: "booking_created" | "payment_confirmed";
  guestEmail: string;
  guestName: string;
  bookingId: string;
}) {
  const recipients = [params.guestEmail, env.bookingAlertEmail].filter(Boolean);

  if (!env.resendApiKey) {
    await logNotification({
      event: params.event,
      recipients,
      payload: {
        bookingId: params.bookingId,
        guestName: params.guestName,
        skipped: true
      }
    });

    return { ok: false, skipped: true };
  }

  const site = getSiteCopy();

  const body = {
    from: env.notificationFromEmail,
    to: recipients,
    subject:
      params.event === "payment_confirmed"
        ? `Camob Residence booking confirmed: ${params.bookingId}`
        : `Camob Residence booking received: ${params.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #191c1d; line-height: 1.5;">
        <h2>${site.name}</h2>
        <p>Hello ${params.guestName},</p>
        <p>Your reservation update has been recorded.</p>
        <p>Booking reference: <strong>${params.bookingId}</strong></p>
      </div>
    `
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  await logNotification({
    event: params.event,
    recipients,
    payload: {
      bookingId: params.bookingId,
      guestName: params.guestName,
      delivered: response.ok
    }
  });

  return { ok: response.ok, skipped: false };
}
