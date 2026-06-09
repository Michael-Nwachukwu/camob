// End-to-end smoke for all four agents against the live argens key.
// Each is an in-process call — no dev server, no Paystack signature, no HTTP
// round-trip. Confirms the code paths execute and the LLM returns shaped text.
//
// Run: ARGENS_BASE_URL=https://api.argens.xyz/v1 \
//      ARGENS_LLM_SERVICE=deepseek_deepseek_chat \
//      ARGENS_LLM_MODEL=deepseek-chat \
//      npx tsx scripts/argens-smoke-all.ts
import { env } from "@/lib/env";
import { argensChat, ArgensError } from "@/lib/services/argens";
import { buildSiteKnowledge } from "@/lib/agents/knowledge";
import { generateItinerary } from "@/lib/services/itinerary";
import { runWeeklyBrief } from "@/lib/services/weekly-brief";
import type { Booking } from "@/lib/types";

function header(name: string) {
  console.log(`\n${"=".repeat(72)}\n  ${name}\n${"=".repeat(72)}`);
}

function trim(s: string, n = 240) {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n)}…` : flat;
}

const fakeBooking: Booking = {
  id: "smoke-test-booking",
  unitId: "unit-1a",
  apartmentTypeId: "one-bedroom",
  checkIn: "2026-07-10",
  checkOut: "2026-07-13",
  status: "confirmed",
  guest: {
    fullName: "Ada Test",
    email: "ada@example.com",
    phone: "+2348000000000",
    guests: 2,
    specialRequests: "Quiet stay, would love a good local bookshop and somewhere for a long walk on the beach."
  },
  subtotal: 285000,
  serviceCharge: 15000,
  total: 300000,
  createdAt: new Date().toISOString(),
  paymentMethod: "paystack",
  paymentStatus: "paid"
};

async function run(name: string, fn: () => Promise<string>) {
  try {
    const out = await fn();
    console.log(`✓ ${name}\n  → ${trim(out)}`);
  } catch (e) {
    if (e instanceof ArgensError) console.error(`✗ ${name} [${e.kind}]: ${e.message}`);
    else console.error(`✗ ${name}:`, e);
  }
}

async function main() {
  if (!env.argensApiKey) {
    console.error("ARGENS_API_KEY is unset.");
    process.exit(1);
  }
  console.log(`LLM: ${env.argensLlmService} / ${env.argensLlmModel}`);

  header("1 — Concierge (knowledge-grounded Q&A)");
  await run("check-in time question", () =>
    argensChat({
      agent: "concierge",
      system: `Answer from the knowledge bundle. Be short.\n\n${buildSiteKnowledge()}`,
      messages: [{ role: "user", content: "What time is check-in and check-out?" }],
      maxTokens: 120
    })
  );

  header("2 — Itinerary (per-booking personalisation)");
  await run("3-night Lekki itinerary", async () => {
    const { html } = await generateItinerary(fakeBooking);
    return html;
  });

  header("3 — Admin co-pilot (read-only digest draft)");
  await run("draft a pending-transfers digest", () =>
    argensChat({
      agent: "copilot",
      system: "You are an operations co-pilot for a single admin. Warm, lowercase eyebrows. Be tight.",
      messages: [
        {
          role: "user",
          content: `Draft a 4-line admin digest titled "— bank transfers pending" from this list:\n- ckxa1 · Tunde Adeyemi · 1-Bedroom · 12 Jul → 14 Jul · ₦190,000 · 18h waiting\n- ckxa2 · Mary Okeke · 2-Bedroom · 20 Jul → 25 Jul · ₦595,000 · 4h waiting`
        }
      ],
      maxTokens: 250
    })
  );

  header("4 — Weekly market-positioning brief");
  await run("full weekly-brief pipeline", async () => {
    const result = await runWeeklyBrief();
    return JSON.stringify(result);
  });
}

main();
