import { env } from "@/lib/env";
import { getSiteCopy } from "@/lib/services/repository";

export async function sendBookingNotification(params: {
  event: "booking_created" | "payment_confirmed";
  guestEmail: string;
  guestName: string;
  bookingId: string;
}) {
  if (!env.resendApiKey) {
    return { ok: false, skipped: true };
  }

  const site = getSiteCopy();

  const body = {
    from: env.notificationFromEmail,
    to: [params.guestEmail, env.bookingAlertEmail],
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

  return { ok: response.ok, skipped: false };
}
