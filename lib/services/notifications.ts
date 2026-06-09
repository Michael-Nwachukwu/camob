import type { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { buildBookingEmails, type NotificationEvent } from "@/lib/services/email-templates";
import type { Booking } from "@/lib/types";

// Strict booking-lifecycle events keep flowing through `sendBookingNotification`;
// adjacent agent emails (itinerary, weekly brief) widen the logger's event type
// only — they reuse the same Resend POST + NotificationLog audit row.
export type LogEvent = NotificationEvent | "itinerary_sent" | "weekly_brief_sent";

async function logNotification(params: {
  event: LogEvent;
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

// One-shot Resend send + audit. Exported for non-booking channels (itinerary,
// weekly brief). When `resendApiKey` is unset we still log the skip so the
// audit trail tells us *why* no email went out.
export async function sendOneEmail(params: {
  event: LogEvent;
  to: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: boolean; skipped?: true }> {
  if (!env.resendApiKey) {
    await logNotification({
      event: params.event,
      recipient: params.to,
      payload: { ...(params.metadata ?? {}), skipped: true }
    });
    return { ok: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.notificationFromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html
    })
  });

  const error = response.ok ? undefined : (await response.text().catch(() => "")).slice(0, 500);

  await logNotification({
    event: params.event,
    recipient: params.to,
    payload: {
      ...(params.metadata ?? {}),
      delivered: response.ok,
      ...(error ? { error } : {})
    }
  });

  return { ok: response.ok };
}

export async function sendBookingNotification(params: {
  event: NotificationEvent;
  booking: Booking;
  token: string;
}) {
  const { event, booking, token } = params;
  const guestEmail = booking.guest.email;
  const adminEmail = env.bookingAlertEmail;
  const emails = buildBookingEmails({ event, booking, token, baseUrl: env.appUrl });

  const guest = guestEmail
    ? await sendOneEmail({
        event,
        to: guestEmail,
        subject: emails.guest.subject,
        html: emails.guest.html,
        metadata: { bookingId: booking.id, audience: "guest" }
      })
    : { ok: true };

  const admin = adminEmail
    ? await sendOneEmail({
        event,
        to: adminEmail,
        subject: emails.admin.subject,
        html: emails.admin.html,
        metadata: { bookingId: booking.id, audience: "admin" }
      })
    : { ok: true };

  return { ok: guest.ok && admin.ok, skipped: !env.resendApiKey };
}
