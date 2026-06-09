import { NextResponse } from "next/server";
import { z } from "zod";
import { argensChat, ArgensError, isArgensDisabled } from "@/lib/services/argens";
import { buildSiteKnowledge } from "@/lib/agents/knowledge";
import { siteCopy } from "@/lib/data/camob";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1500)
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(12)
});

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

const PERSONA = `You are the on-site concierge for Camob Residence, a small two-maisonette short-let in Ogombo, Lekki, Lagos. Warm, slightly understated, lowercase-eyebrow tone — no SaaS jargon, no emojis. Keep answers tight (1–3 short paragraphs).

Ground every answer in the knowledge below. If a guest asks something not covered (specific availability, custom pricing, billing disputes, anything sensitive), say so plainly and point them to WhatsApp: ${siteCopy.whatsapp}. Never invent rates, dates, or amenities. Never read out the bank account number.`;

const FALLBACK_REPLY = `I'm offline at the moment — for anything time-sensitive, please reach us on WhatsApp: ${siteCopy.whatsapp}.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const limit = rateLimit(clientIp(request));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  if (isArgensDisabled()) {
    return NextResponse.json({ reply: FALLBACK_REPLY, disabled: true });
  }

  try {
    const reply = await argensChat({
      agent: "concierge",
      system: `${PERSONA}\n\n---\n\n${buildSiteKnowledge()}`,
      messages: parsed.data.messages,
      maxTokens: 400
    });
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof ArgensError && error.kind === "disabled") {
      return NextResponse.json({ reply: FALLBACK_REPLY, disabled: true });
    }
    // Any other failure: graceful fallback so the panel never strands the guest.
    return NextResponse.json({ reply: FALLBACK_REPLY, error: true });
  }
}
