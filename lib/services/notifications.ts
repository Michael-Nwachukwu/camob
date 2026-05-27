import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildBookingEmails, type NotificationEvent, type EmailContent } from "@/lib/services/email-templates";
import type { Booking } from "@/lib/types";

async function logNotification(params: {
  event: NotificationEvent;
  recipient: string;
  payload: Record<string, unknown>;
}) {
  if (!env.databaseUrl || !params.recipient) {
    return;
  }

  try {
    await prisma.notificationLog.create({
      data: {
        channel: "email",
        event: params.event,
        recipient: params.recipient,
        payload: params.payload as Prisma.InputJsonValue
      }
    });
  } catch {
    return;
  }
}

async function sendOne(params: {
  event: NotificationEvent;
  bookingId: string;
  to: string;
  audience: "guest" | "admin";
  content: EmailContent;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.notificationFromEmail,
      to: [params.to],
      subject: params.content.subject,
      html: params.content.html
    })
  });

  // Capture Resend's rejection reason so failures are debuggable from the
  // notification log (e.g. unverified from-domain) instead of vanishing.
  const error = response.ok ? undefined : (await response.text().catch(() => "")).slice(0, 500);

  await logNotification({
    event: params.event,
    recipient: params.to,
    payload: {
      bookingId: params.bookingId,
      audience: params.audience,
      delivered: response.ok,
      ...(error ? { error } : {})
    }
  });

  return response.ok;
}

export async function sendBookingNotification(params: {
  event: NotificationEvent;
  booking: Booking;
  token: string;
}) {
  const { event, booking, token } = params;
  const guestEmail = booking.guest.email;
  const adminEmail = env.bookingAlertEmail;

  if (!env.resendApiKey) {
    for (const recipient of [guestEmail, adminEmail].filter(Boolean)) {
      await logNotification({
        event,
        recipient,
        payload: { bookingId: booking.id, skipped: true }
      });
    }
    return { ok: false, skipped: true };
  }

  const emails = buildBookingEmails({ event, booking, token, baseUrl: env.appUrl });

  const guestOk = guestEmail
    ? await sendOne({ event, bookingId: booking.id, to: guestEmail, audience: "guest", content: emails.guest })
    : true;
  const adminOk = adminEmail
    ? await sendOne({ event, bookingId: booking.id, to: adminEmail, audience: "admin", content: emails.admin })
    : true;

  return { ok: guestOk && adminOk, skipped: false };
}
