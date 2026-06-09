import { addDays, format } from "date-fns";
import { env } from "@/lib/env";
import { argensCall, argensChat, argensSendMail, ArgensError, isArgensDisabled } from "@/lib/services/argens";
import { C, SERIF, SANS, shell, para } from "@/lib/services/email-templates";
import { apartmentTypes } from "@/lib/data/camob";
import { getActiveBookingsAsync, hasDatabase } from "@/lib/services/repository";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Weekly market-positioning brief — scans events / holidays / happenings in
// Lagos for the coming week, then asks the LLM to write the admin a short
// strategy memo: audience, channels, positioning angles, ad-copy starters.
// Delivered via argens marketplace mail (the "agent mail" channel) so the
// outbound path is fully argens-routed, separate from Resend.

// Brave web-search returns a search-result envelope nested at
// `data.result.data` (the second `data` is brave's own wrapper). We mine the
// FAQ block and the top web results for event-bearing snippets and hand them
// to the LLM as raw text — no rigid event schema to maintain.
type BraveSearchPayload = {
  data?: {
    faq?: { results?: Array<{ question?: string; answer?: string; title?: string; url?: string }> };
    web?: { results?: Array<{ title?: string; description?: string; url?: string }> };
    news?: { results?: Array<{ title?: string; description?: string; url?: string; age?: string }> };
  };
};

function brandHtml(reportFragmentHtml: string, weekLabel: string): string {
  const styled = reportFragmentHtml
    .replace(/<h2>/g, `<h2 style="margin:24px 0 6px;font:600 22px/1.2 ${SERIF};color:${C.ink};letter-spacing:-0.3px;">`)
    .replace(/<h3>/g, `<h3 style="margin:16px 0 6px;font:600 17px/1.25 ${SERIF};color:${C.ink};">`)
    .replace(/<p>/g, `<p style="margin:0 0 12px;font:15px/1.65 ${SANS};color:${C.body};">`)
    .replace(/<ul>/g, `<ul style="margin:0 0 12px 18px;padding:0;font:15px/1.6 ${SANS};color:${C.body};">`)
    .replace(/<li>/g, `<li style="margin:0 0 6px;">`)
    .replace(/<strong>/g, `<strong style="color:${C.ink};">`);

  return shell({
    preheader: `Week of ${weekLabel} — positioning`,
    heading: `Positioning for the week of ${weekLabel}.`,
    bodyHtml:
      para(`A read of what's happening around Lekki + Lagos this week, with audience cuts and ad-copy starters tailored to who's likely in town. Pick what's useful, ignore the rest.`) +
      `<div style="margin:8px 0 0;">${styled}</div>`,
    attribution: { baseUrl: env.appUrl }
  });
}

export async function runWeeklyBrief(): Promise<
  | { ok: true; eventsCount: number; sent: boolean; deliveryUnverified?: boolean }
  | { ok: false; reason: string }
> {
  if (isArgensDisabled()) {
    return { ok: false, reason: "argens-disabled" };
  }

  const now = new Date();
  const weekLabel = `${format(now, "d MMM")}–${format(addDays(now, 7), "d MMM yyyy")}`;

  // 1. Events lookup — Brave web-search for "events in Lagos this week",
  //    then mine the FAQ and top web results for snippets the LLM can read.
  //    If the search service is disabled or down, fall through with empty
  //    signals — the LLM falls back to general-knowledge framing.
  let eventSnippets: string[] = [];
  try {
    const res = await argensCall<BraveSearchPayload>({
      agent: "weekly-brief",
      service: env.argensEventsService,
      payload: { q: `events in Lagos Nigeria ${weekLabel}` }
    });
    const brave = res.data?.data;
    const faqLines = (brave?.faq?.results ?? []).slice(0, 4).flatMap((r) =>
      r.question && r.answer ? [`Q: ${r.question}\nA: ${r.answer}`] : []
    );
    const webLines = (brave?.web?.results ?? []).slice(0, 6).flatMap((r) =>
      r.title ? [`- ${r.title}${r.description ? ` — ${r.description}` : ""}`] : []
    );
    const newsLines = (brave?.news?.results ?? []).slice(0, 4).flatMap((r) =>
      r.title ? [`- ${r.title}${r.description ? ` — ${r.description}` : ""}${r.age ? ` (${r.age})` : ""}`] : []
    );
    eventSnippets = [
      ...(faqLines.length ? ["FAQ-style summaries:", ...faqLines] : []),
      ...(webLines.length ? ["Web results:", ...webLines] : []),
      ...(newsLines.length ? ["News:", ...newsLines] : [])
    ];
  } catch (error) {
    if (error instanceof ArgensError && error.kind === "disabled") {
      return { ok: false, reason: "argens-disabled" };
    }
  }

  // 2. Occupancy hint — what's already booked next 7 days, what's open.
  let bookedNotes = "(no booking data — DB unavailable)";
  if (hasDatabase()) {
    const active = await getActiveBookingsAsync();
    const sevenDaysOut = addDays(now, 7).getTime();
    const upcoming = active.filter((b) => new Date(b.checkIn).getTime() <= sevenDaysOut);
    bookedNotes = upcoming.length
      ? upcoming.map((b) => `- ${b.apartmentTypeId}: ${b.checkIn} → ${b.checkOut}`).join("\n")
      : "- Nothing booked next 7 days (both apartments open).";
  }

  const inventory = apartmentTypes
    .map((a) => `- ${a.name}: sleeps ${a.maxGuests}, ${a.bedrooms} bed/${a.bathrooms} bath, from ₦${a.ratePerNight.toLocaleString()} / night`)
    .join("\n");

  // 3. Synthesise the report.
  const persona = `You are the marketing strategist for Camob Residence, a two-maisonette short-let in Ogombo, Lekki (1 min from Charterhouse Lagos, ~15 min from Victoria Island). Write a tight weekly positioning brief for the single admin.

Tone: warm, slightly understated, lowercase eyebrows ("— who's in town", "— how to reach them"). British spelling. No SaaS jargon, no emojis.

Output: plain HTML using <h2>, <h3>, <p>, <ul>, <li>, <strong>. No styles, no class names, no <html>/<body>.

Sections (use these h2 headings exactly):
<h2>— this week at a glance</h2> — 2-4 bullets summarising what's happening.
<h2>— audience targets</h2> — who's likely travelling to Lekki this week and why.
<h2>— outreach: who to reach out to, how</h2> — concrete partner ideas (e.g. event organisers, concierges at Charterhouse, corporate travel desks). For each, suggest how to reach them (DM, email, walk-in flyer drop) and one talking point.
<h2>— positioning angles</h2> — 2-3 brand framings tied to the events (e.g. "stay close to the venue, skip the late-night drive").
<h2>— ad copy starters</h2> — 3-5 short ad headlines + body copy pairs ready to drop into Meta / Google ads.

If events list is empty, lean into seasonal + business-travel patterns for Lekki / VI.`;

  const eventsBlock = eventSnippets.length
    ? eventSnippets.join("\n")
    : "(no event signals — work from seasonal and business-travel patterns)";

  const userPrompt = `Week: ${weekLabel}\nLocation: Ogombo, Lekki Scheme 2, Lagos\nCamob inventory:\n${inventory}\n\nUpcoming bookings (so we don't over-promote inventory we don't have):\n${bookedNotes}\n\nEvent signals (from a web search — extract what looks relevant for short-let positioning, ignore noise):\n${eventsBlock}\n\nDraft the brief now.`;

  const reportFragment = await argensChat({
    agent: "weekly-brief",
    system: persona,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 1600
  });

  const html = brandHtml(reportFragment, weekLabel);

  // 4. Send via agent mail. We also log a NotificationLog row directly here so
  //    /admin/notifications surfaces the dispatch alongside the booking emails.
  let sent = false;
  let deliveryUnverified = false;
  try {
    const result = await argensSendMail({
      agent: "weekly-brief",
      to: env.weeklyBriefRecipient,
      subject: `Camob — week of ${weekLabel} positioning brief`,
      html
    });
    sent = true;
    deliveryUnverified = result.deliveryUnverified ?? false;
  } catch {
    sent = false;
  }

  if (env.databaseUrl) {
    try {
      await prisma.notificationLog.create({
        data: {
          channel: "agent-mail",
          event: "weekly_brief_sent",
          recipient: env.weeklyBriefRecipient,
          payload: {
            weekLabel,
            eventSnippetCount: eventSnippets.length,
            delivered: sent,
            ...(deliveryUnverified ? { deliveryUnverified: true } : {})
          } as Prisma.InputJsonValue
        }
      });
    } catch {
      // best-effort audit
    }
  }

  return { ok: true, eventsCount: eventSnippets.length, sent, deliveryUnverified };
}

