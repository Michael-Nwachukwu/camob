import { env } from "@/lib/env";
import { generateItinerary } from "@/lib/services/itinerary";
import { sendOneEmail } from "@/lib/services/notifications";
import { isArgensDisabled } from "@/lib/services/argens";
import { C, SERIF, SANS, detailsCard, shell, para, button } from "@/lib/services/email-templates";
import { apartmentTypes } from "@/lib/data/camob";
import type { Booking } from "@/lib/types";

// Wraps the LLM-generated itinerary in the same brand-shell as the lifecycle
// emails so the guest sees one consistent voice. Heading-level <h3>s inside
// the LLM output get re-styled here with inline CSS for email safety.
function styleItineraryFragment(html: string): string {
  return html
    .replace(/<h3>/g, `<h3 style="margin:18px 0 8px;font:600 18px/1.25 ${SERIF};color:${C.ink};">`)
    .replace(/<p>/g, `<p style="margin:0 0 12px;font:15px/1.65 ${SANS};color:${C.body};">`)
    .replace(/<ul>/g, `<ul style="margin:0 0 12px 18px;padding:0;font:15px/1.6 ${SANS};color:${C.body};">`)
    .replace(/<li>/g, `<li style="margin:0 0 6px;">`)
    .replace(/<strong>/g, `<strong style="color:${C.ink};">`);
}

export function buildItineraryEmail(params: {
  booking: Booking;
  itineraryHtml: string;
  token: string;
  baseUrl: string;
}): { subject: string; html: string } {
  const { booking, itineraryHtml, token, baseUrl } = params;
  const apartmentName = apartmentTypes.find((a) => a.id === booking.apartmentTypeId)?.name ?? booking.apartmentTypeId;
  const firstName = booking.guest.fullName.split(" ")[0] || "there";
  const bookingUrl = `${baseUrl}/booking/${booking.id}?token=${token}`;

  const body =
    para(`Hi ${firstName} — your dates at the <strong>${apartmentName}</strong> are locked in. Here's a small itinerary to play with while you pack.`) +
    detailsCard(booking, apartmentName) +
    `<div style="margin:18px 0 8px;">${styleItineraryFragment(itineraryHtml)}</div>` +
    button("View your booking", bookingUrl);

  return {
    subject: `Your Camob itinerary — ${apartmentName}`,
    html: shell({
      preheader: `A little plan for your ${apartmentName} stay`,
      heading: "A small plan for your stay.",
      bodyHtml: body,
      attribution: { baseUrl }
    })
  };
}

// Fire-and-forget from the Paystack webhook. Never throws — a failed itinerary
// must not bounce the confirmation flow. Skips silently when Argens is disabled
// or no Resend key is set; the lifecycle confirmation email still goes out.
export async function sendItineraryEmail(booking: Booking, token: string): Promise<void> {
  if (isArgensDisabled() || !env.resendApiKey) return;
  try {
    const { html: itineraryHtml } = await generateItinerary(booking);
    const email = buildItineraryEmail({ booking, itineraryHtml, token, baseUrl: env.appUrl });
    await sendOneEmail({
      event: "itinerary_sent",
      to: booking.guest.email,
      subject: email.subject,
      html: email.html,
      metadata: { bookingId: booking.id }
    });
  } catch {
    // Best-effort — the booking is confirmed regardless.
  }
}
