import { siteCopy, apartmentTypes, attractions, faqItems } from "@/lib/data/camob";
import { formatCurrency } from "@/lib/utils";

// Compact markdown bundle for the agent system prompt. Small enough to live
// inside the prompt (no retrieval needed) and shared between the concierge
// (Q&A grounding) and the itinerary agent (apartment + neighbourhood context).
// Deliberately excludes the bank account number — the LLM should never read
// that out; bank transfer details live on a dedicated, token-gated page.
export function buildSiteKnowledge(): string {
  const apartments = apartmentTypes
    .map(
      (a) =>
        `### ${a.name}\n- Sleeps ${a.maxGuests}, ${a.bedrooms} bed / ${a.bathrooms} bath\n- ${formatCurrency(a.ratePerNight)} / night\n- ${a.longDescription ?? a.description}\n- Amenities: ${a.amenities.slice(0, 8).join(", ")}`
    )
    .join("\n\n");

  const nearby = attractions
    .slice(0, 12)
    .map(
      (a) =>
        `- ${a.name} (${a.category}) — ${a.driveTime}${a.distanceKm ? `, ~${a.distanceKm} km` : ""}. ${a.description}`
    )
    .join("\n");

  const discounts = siteCopy.stayPolicies.discounts.map((d) => `- ${d.stay}: ${d.off}`).join("\n");

  const cancellation = siteCopy.cancellationPolicy.brackets
    .map((b) => `- ${b.label}: ${b.refundPct}% back`)
    .join("\n");

  const faqBlock = faqItems.map((q) => `**${q.question}**\n${q.answer}`).join("\n\n");

  return `# Camob Residence — house knowledge

${siteCopy.description}

${siteCopy.longPitch}

**Location**: ${siteCopy.address}
**Check-in**: ${siteCopy.checkIn} · **Check-out**: ${siteCopy.checkOut}
**WhatsApp**: ${siteCopy.whatsapp}

## Apartments

${apartments}

## Stay discounts
${discounts}

## Cancellation policy
${siteCopy.cancellationPolicy.summary}
${cancellation}
(Service charge is non-refundable once a stay is booked.)

## Payment
- Paystack confirms instantly. Bank transfer is reviewed manually within a few hours.
- For bank transfer details, send guests to the booking page link they receive by email — never read out the account number.

## Nearby (the neighbourhood)
${nearby}

## FAQ (verbatim — quote these answers when relevant)

${faqBlock}`;
}
