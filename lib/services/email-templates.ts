import { siteCopy, apartmentTypes } from "@/lib/data/camob";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export type NotificationEvent = "booking_created" | "payment_confirmed" | "booking_cancelled";
export type EmailContent = { subject: string; html: string };
export type BookingEmails = { guest: EmailContent; admin: EmailContent };

// ── palette (email-safe inline styles; clients don't load web fonts, so the
// serif falls back to Georgia) ──
const C = {
  brand: "#800020",
  ink: "#211922",
  body: "#33332e",
  mute: "#62625b",
  surface: "#fbfbf9",
  card: "#f6f6f3",
  canvas: "#ffffff",
  hairline: "#dadad3",
  success: "#103c25"
};
const SERIF = "'Iowan Old Style', Palatino, 'Book Antiqua', Georgia, serif";
const SANS = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

function row(label: string, value: string, accent = false) {
  return `
    <tr>
      <td style="padding:6px 0;font:13px ${SANS};color:${C.mute};">${label}</td>
      <td style="padding:6px 0;font:${accent ? "700 16px" : "600 14px"} ${SANS};color:${accent ? C.brand : C.ink};text-align:right;">${value}</td>
    </tr>`;
}

function detailsCard(booking: Booking, apartmentName: string) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:${C.card};border-radius:16px;padding:18px 20px;margin:8px 0 4px;">
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${row("Apartment", apartmentName)}
          ${row("Check-in", formatDate(booking.checkIn))}
          ${row("Check-out", formatDate(booking.checkOut))}
          ${row("Nights", `${nights}`)}
          ${row("Reference", booking.id)}
          ${row("Total", formatCurrency(booking.total), true)}
        </table>
      </td></tr>
    </table>`;
}

function button(label: string, url: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;">
      <tr><td style="border-radius:999px;background:${C.brand};">
        <a href="${url}" style="display:inline-block;padding:13px 26px;font:700 14px ${SANS};color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
      </td></tr>
    </table>`;
}

function shell(opts: { preheader: string; heading: string; bodyHtml: string }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.surface};">
  <span style="display:none;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${opts.preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.canvas};border:1px solid ${C.hairline};border-radius:24px;overflow:hidden;">
        <tr><td style="padding:26px 30px 0;">
          <p style="margin:0;font:italic 14px ${SERIF};color:${C.brand};">Camob Residence</p>
        </td></tr>
        <tr><td style="padding:10px 30px 26px;">
          <h1 style="margin:0 0 12px;font:600 26px/1.15 ${SERIF};color:${C.ink};letter-spacing:-0.4px;">${opts.heading}</h1>
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 30px 26px;border-top:1px solid ${C.hairline};">
          <p style="margin:0;font:13px/1.6 ${SANS};color:${C.mute};">${siteCopy.address}</p>
          <p style="margin:6px 0 0;font:13px/1.6 ${SANS};color:${C.mute};">Questions? <a href="${siteCopy.whatsapp}" style="color:${C.brand};">Message us on WhatsApp</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function para(text: string) {
  return `<p style="margin:0 0 12px;font:15px/1.65 ${SANS};color:${C.body};">${text}</p>`;
}

export function buildBookingEmails(params: {
  event: NotificationEvent;
  booking: Booking;
  token: string;
  baseUrl: string;
}): BookingEmails {
  const { event, booking, token, baseUrl } = params;
  const apartmentName = apartmentTypes.find((a) => a.id === booking.apartmentTypeId)?.name ?? booking.apartmentTypeId;
  const firstName = booking.guest.fullName.split(" ")[0] || "there";
  const bookingUrl = `${baseUrl}/booking/${booking.id}?token=${token}`;
  const transferUrl = `${baseUrl}/booking/bank-transfer?bookingId=${booking.id}&token=${token}`;
  const adminUrl = `${baseUrl}/admin/bookings`;
  const card = detailsCard(booking, apartmentName);
  const isPaystack = booking.paymentMethod === "paystack";

  if (event === "booking_created") {
    const guestBody = isPaystack
      ? para(`Hi ${firstName} — we're holding the <strong>${apartmentName}</strong> for you, but only for 15 minutes. Tap below to complete payment and lock it in.`) +
        card +
        button("Complete payment", bookingUrl) +
        para(`Changed your mind? You can cancel from the same page.`)
      : para(`Hi ${firstName} — we're holding the <strong>${apartmentName}</strong> for you. Send a bank transfer using the details below and we'll confirm within a few hours.`) +
        card +
        para(`<strong>${siteCopy.bankTransfer.bankName}</strong> · ${siteCopy.bankTransfer.accountName}<br/>Acct: <strong>${siteCopy.bankTransfer.accountNumber}</strong> · Narration: <strong>${booking.paymentReference ?? booking.id}</strong>`) +
        button("View booking & transfer details", transferUrl);

    const adminBody =
      para(`A new booking is pending (<strong>${isPaystack ? "Paystack" : "bank transfer"}</strong>) from ${booking.guest.fullName} — ${booking.guest.email}, ${booking.guest.phone}.`) +
      card +
      (isPaystack ? "" : para(`Bank transfer — confirm it once the money lands.`)) +
      button("Open admin", adminUrl);

    return {
      guest: {
        subject: isPaystack ? "Your Camob dates are held — finish payment" : "We're holding your Camob dates",
        html: shell({ preheader: `Reference ${booking.id}`, heading: isPaystack ? "Your dates are held" : "We're holding your dates", bodyHtml: guestBody })
      },
      admin: {
        subject: `New ${isPaystack ? "pending" : "bank-transfer"} booking — ${apartmentName}`,
        html: shell({ preheader: `${booking.guest.fullName} · ${apartmentName}`, heading: "New booking — pending", bodyHtml: adminBody })
      }
    };
  }

  if (event === "payment_confirmed") {
    return {
      guest: {
        subject: "You're booked — see you in Lekki",
        html: shell({
          preheader: `Confirmed · ${apartmentName}`,
          heading: "You're booked.",
          bodyHtml:
            para(`Hi ${firstName} — payment's in and your stay is confirmed. We'll send check-in details closer to the date.`) +
            card +
            button("View booking", bookingUrl)
        })
      },
      admin: {
        subject: `Payment confirmed — ${apartmentName}`,
        html: shell({
          preheader: `${booking.guest.fullName} · ${formatCurrency(booking.total)}`,
          heading: "Payment confirmed",
          bodyHtml: para(`${booking.guest.fullName} (${booking.guest.email}) is confirmed.`) + card + button("Open admin", adminUrl)
        })
      }
    };
  }

  // booking_cancelled
  const refundLine =
    booking.refundAmount && booking.refundAmount > 0
      ? para(`A refund of <strong>${formatCurrency(booking.refundAmount)}</strong> is being processed — it usually clears within a few business days.`)
      : para(`No payment was due back on this one.`);

  return {
    guest: {
      subject: "Your Camob booking is cancelled",
      html: shell({
        preheader: `Cancelled · ${booking.id}`,
        heading: "Your booking is cancelled.",
        bodyHtml: para(`Hi ${firstName} — your booking for the ${apartmentName} has been cancelled.`) + card + refundLine
      })
    },
    admin: {
      subject: `Cancellation — ${apartmentName}`,
      html: shell({
        preheader: `${booking.guest.fullName}`,
        heading: "Booking cancelled",
        bodyHtml:
          para(`${booking.guest.fullName} cancelled their ${apartmentName} booking.`) +
          card +
          (booking.refundAmount && booking.refundAmount > 0
            ? para(`<strong>Action:</strong> a refund of ${formatCurrency(booking.refundAmount)} is pending — process it from the admin.`)
            : "") +
          button("Open admin", adminUrl)
      })
    }
  };
}
