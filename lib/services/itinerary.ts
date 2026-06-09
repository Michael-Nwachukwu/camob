import { argensChat } from "@/lib/services/argens";
import { buildSiteKnowledge } from "@/lib/agents/knowledge";
import { apartmentTypes } from "@/lib/data/camob";
import { nightsBetween, formatDate } from "@/lib/utils";
import type { Booking } from "@/lib/types";

// Lekki/Lagos-flavoured itinerary. The agent grounds in our knowledge bundle
// + the booking's apartment, dates, and free-text specialRequests (no separate
// interests field by design). Output is HTML so it slots straight into the
// branded email shell — keep it constrained to <p>/<h3>/<ul>/<li> for inline-CSS
// safety in mail clients.
const PERSONA = `You are a Lekki concierge writing a short pre-arrival itinerary for an upcoming guest at Camob Residence. Warm, slightly understated tone — lowercase eyebrows like "— afternoon" or "— if you'd rather stay in" work well. No SaaS jargon, no emojis. British spelling.

Output requirements:
- Plain HTML using only <p>, <h3>, <ul>, <li>, <strong>, <em>. No <html>, <head>, <body>, no inline styles, no class names.
- Open with a single paragraph welcome that namechecks the apartment and the stay length.
- Then a per-day section (<h3>) for each day of the stay, max 5 days; if longer, group days 4+ as "Beyond day 3" and keep it tighter.
- Each day = 2–4 specific suggestions drawn from the knowledge below (nearby attractions, dining, beach, mall, conservation, etc.). Mix outdoor + indoor + food. Note approximate drive times.
- Honour the guest's specialRequests if any — surface them in the first day or two.
- Close with one short paragraph titled <h3>Reach us</h3> that points to the WhatsApp link in the knowledge if anything changes.

Never invent specific opening hours, prices, or events. If the guest's request is outside what the knowledge covers, suggest the closest thing and invite them to message on WhatsApp.`;

export type Itinerary = { html: string };

export async function generateItinerary(booking: Booking): Promise<Itinerary> {
  const apartment = apartmentTypes.find((a) => a.id === booking.apartmentTypeId);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);

  const userPrompt = `Booking context:
- Apartment: ${apartment?.name ?? booking.apartmentTypeId} (sleeps ${apartment?.maxGuests ?? "?"})
- Check-in: ${formatDate(booking.checkIn)}
- Check-out: ${formatDate(booking.checkOut)}
- Nights: ${nights}
- Guests: ${booking.guest.guests}
- Special requests: ${booking.guest.specialRequests?.trim() || "(none)"}

Draft the itinerary HTML now.`;

  const html = await argensChat({
    agent: "itinerary",
    system: `${PERSONA}\n\n---\n\n${buildSiteKnowledge()}`,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 1200
  });

  return { html };
}
