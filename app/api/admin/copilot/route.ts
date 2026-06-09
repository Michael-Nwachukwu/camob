import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { argensChat, ArgensError, isArgensDisabled } from "@/lib/services/argens";
import { getActiveBookingsAsync, getBookingsAsync, getBookingByIdAsync } from "@/lib/services/repository";
import { canCancel, computeRefund } from "@/lib/services/refunds";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/utils";
import { apartmentTypes } from "@/lib/data/camob";
import type { Booking } from "@/lib/types";

const recipeSchema = z.discriminatedUnion("recipe", [
  z.object({ recipe: z.literal("pending_transfers_digest") }),
  z.object({ recipe: z.literal("this_week_bookings") }),
  z.object({ recipe: z.literal("refund_candidates") }),
  z.object({ recipe: z.literal("reply_to_guest"), guestMessage: z.string().min(1).max(2000), bookingId: z.string().optional() }),
  z.object({ recipe: z.literal("ask"), prompt: z.string().min(1).max(2000) })
]);

const PERSONA = `You are the operations co-pilot for the single admin running Camob Residence (a two-maisonette short-let in Lekki, Lagos). Read-only — you never call mutating actions. Drafts are for the admin to copy or paste into existing tools.

Tone: warm, slightly understated, lowercase eyebrows (like "— pending today" or "— heads up"). British spelling. No SaaS jargon, no emojis. Be specific with reference IDs, names, amounts, and dates the admin can act on. Keep outputs tight.`;

const APARTMENT_LOOKUP = new Map(apartmentTypes.map((a) => [a.id, a.name]));

function bookingLine(b: Booking): string {
  const apt = APARTMENT_LOOKUP.get(b.apartmentTypeId) ?? b.apartmentTypeId;
  const total = formatCurrency(b.total);
  return `- ${b.id} · ${b.guest.fullName} (${b.guest.email}) · ${apt} · ${formatDate(b.checkIn)} → ${formatDate(b.checkOut)} (${nightsBetween(b.checkIn, b.checkOut)}n) · ${total} · status=${b.status}/${b.paymentStatus ?? "—"}`;
}

function isPendingTransfer(b: Booking): boolean {
  return b.paymentMethod === "bank_transfer" && b.paymentStatus === "pending_review" && b.status === "pending_payment";
}

function isThisWeek(b: Booking, now: Date): boolean {
  const checkIn = new Date(b.checkIn);
  const sevenDays = now.getTime() + 7 * 24 * 60 * 60 * 1000;
  return b.status === "confirmed" && checkIn.getTime() <= sevenDays && checkIn.getTime() >= now.getTime();
}

function isRefundCandidate(b: Booking): boolean {
  return b.status === "refund_pending" || (b.status === "cancelled" && (b.refundAmount ?? 0) > 0);
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (isArgensDisabled()) {
    return NextResponse.json({ error: "Co-pilot is offline — ARGENS_API_KEY is unset." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let prompt: string;
  const actionLinks: Array<{ label: string; href: string }> = [];

  switch (parsed.data.recipe) {
    case "pending_transfers_digest": {
      const all = await getBookingsAsync();
      const pending = all.filter(isPendingTransfer);
      if (pending.length === 0) {
        return NextResponse.json({
          draft: "No bank transfers are pending review right now. Inbox is clear.",
          actionLinks: [{ label: "Open bookings", href: "/admin/bookings" }]
        });
      }
      prompt = `Draft a tight admin digest titled "— bank transfers pending" listing each booking with what action you'd recommend (confirm, follow up, expire). Use plain text + dashes, no markdown headers. Surface anything older than 24 hours with a "heads up — chase" line.\n\nBookings:\n${pending.map(bookingLine).join("\n")}`;
      actionLinks.push({ label: "Open bookings", href: "/admin/bookings" });
      break;
    }
    case "this_week_bookings": {
      const active = await getActiveBookingsAsync();
      const window = active.filter((b) => isThisWeek(b, new Date()));
      if (window.length === 0) {
        return NextResponse.json({
          draft: "Nothing confirmed for the next 7 days. Quiet week.",
          actionLinks: [{ label: "Open calendar", href: "/admin/calendar" }]
        });
      }
      prompt = `Draft a short ops note titled "— this week" listing each upcoming stay with check-in date, apartment, guest name, and one prep nudge (e.g. "early arrival — confirm key handoff"). Plain text.\n\nBookings:\n${window.map(bookingLine).join("\n")}`;
      actionLinks.push({ label: "Open calendar", href: "/admin/calendar" });
      break;
    }
    case "refund_candidates": {
      const all = await getBookingsAsync();
      const candidates = all.filter(isRefundCandidate);
      if (candidates.length === 0) {
        return NextResponse.json({
          draft: "No outstanding refunds. Nothing to action.",
          actionLinks: [{ label: "Open bookings", href: "/admin/bookings" }]
        });
      }
      const enriched = candidates
        .map((b) => {
          const refund = computeRefund(b);
          return `${bookingLine(b)} · refund=${formatCurrency(b.refundAmount ?? refund.refundAmount)} (${refund.label})`;
        })
        .join("\n");
      prompt = `Draft a short admin note titled "— refunds outstanding" with each candidate and one recommended next step. Plain text.\n\nCandidates:\n${enriched}`;
      actionLinks.push({ label: "Open bookings", href: "/admin/bookings" });
      break;
    }
    case "reply_to_guest": {
      let bookingContext = "(no booking attached)";
      if (parsed.data.bookingId) {
        const b = await getBookingByIdAsync(parsed.data.bookingId);
        if (b) {
          bookingContext = bookingLine(b) + (b.guest.specialRequests ? `\n  special requests: ${b.guest.specialRequests}` : "");
          actionLinks.push({ label: "Open booking", href: `/admin/bookings` });
          if (canCancel(b)) {
            actionLinks.push({
              label: `Email guest (${b.guest.email})`,
              href: `mailto:${b.guest.email}?subject=Camob%20Residence%20%E2%80%94%20booking%20${encodeURIComponent(b.id)}`
            });
          }
        }
      }
      prompt = `Draft a short, warm reply to the guest below. Match the brand voice. Don't promise refunds or rate changes. If the message asks something outside policy, offer to look into it.\n\nBooking: ${bookingContext}\n\nGuest message:\n"""\n${parsed.data.guestMessage}\n"""`;
      break;
    }
    case "ask": {
      prompt = parsed.data.prompt;
      break;
    }
  }

  try {
    const draft = await argensChat({
      agent: "copilot",
      system: PERSONA,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 700
    });
    return NextResponse.json({ draft, actionLinks });
  } catch (error) {
    if (error instanceof ArgensError && error.kind === "disabled") {
      return NextResponse.json({ error: "Co-pilot is offline." }, { status: 503 });
    }
    return NextResponse.json({ error: "Co-pilot failed — try again." }, { status: 502 });
  }
}
