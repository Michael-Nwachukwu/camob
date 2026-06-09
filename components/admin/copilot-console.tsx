"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink, MessagesSquare, Receipt, RotateCcw, Send, Wand2 } from "lucide-react";

type Recipe =
  | { id: "pending_transfers_digest"; label: string; description: string }
  | { id: "this_week_bookings"; label: string; description: string }
  | { id: "refund_candidates"; label: string; description: string }
  | { id: "reply_to_guest"; label: string; description: string }
  | { id: "ask"; label: string; description: string };

const RECIPES: Recipe[] = [
  { id: "pending_transfers_digest", label: "Pending transfers digest", description: "Bank transfers waiting on manual review." },
  { id: "this_week_bookings", label: "This week's stays", description: "Confirmed check-ins in the next 7 days." },
  { id: "refund_candidates", label: "Refunds outstanding", description: "Cancelled / refund-pending bookings to action." },
  { id: "reply_to_guest", label: "Reply to a guest message", description: "Draft a reply to something a guest sent you." },
  { id: "ask", label: "Free prompt", description: "Anything else — drafts, summaries, copy starters." }
];

const ICONS = {
  pending_transfers_digest: Receipt,
  this_week_bookings: MessagesSquare,
  refund_candidates: RotateCcw,
  reply_to_guest: MessagesSquare,
  ask: Wand2
} as const;

type RunResult = { draft: string; actionLinks?: Array<{ label: string; href: string }> };

export function CopilotConsole() {
  const [activeId, setActiveId] = useState<Recipe["id"]>("pending_transfers_digest");
  const [guestMessage, setGuestMessage] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [freePrompt, setFreePrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const active = RECIPES.find((r) => r.id === activeId)!;

  async function run() {
    setRunning(true);
    setResult(null);
    const toastId = toast.loading("Drafting…");

    const body: Record<string, unknown> = { recipe: activeId };
    if (activeId === "reply_to_guest") {
      if (!guestMessage.trim()) {
        toast.error("Paste the guest's message first.", { id: toastId });
        setRunning(false);
        return;
      }
      body.guestMessage = guestMessage;
      if (bookingId.trim()) body.bookingId = bookingId.trim();
    }
    if (activeId === "ask") {
      if (!freePrompt.trim()) {
        toast.error("Add a prompt first.", { id: toastId });
        setRunning(false);
        return;
      }
      body.prompt = freePrompt;
    }

    try {
      const response = await fetch("/api/admin/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) {
        toast.error(payload.error ?? "Co-pilot failed.", { id: toastId });
        return;
      }
      setResult({ draft: payload.draft, actionLinks: payload.actionLinks ?? [] });
      toast.success("Draft ready.", { id: toastId });
    } catch {
      toast.error("Couldn't reach the co-pilot.", { id: toastId });
    } finally {
      setRunning(false);
    }
  }

  function copyDraft() {
    if (!result) return;
    navigator.clipboard.writeText(result.draft).then(
      () => toast.success("Copied to clipboard."),
      () => toast.error("Couldn't copy.")
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="space-y-1">
        <p className="px-2 font-serif text-xs italic text-mute">— recipes</p>
        {RECIPES.map((r) => {
          const Icon = ICONS[r.id];
          const selected = r.id === activeId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setActiveId(r.id);
                setResult(null);
              }}
              className={
                "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition " +
                (selected ? "bg-surface-card text-ink" : "text-body hover:bg-surface-card/60")
              }
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-mute" />
              <span>
                <span className="block text-sm font-semibold text-ink">{r.label}</span>
                <span className="block text-xs text-mute">{r.description}</span>
              </span>
            </button>
          );
        })}
      </aside>

      <section className="space-y-5 rounded-md border border-hairline bg-canvas p-5">
        <header>
          <p className="font-serif text-xs italic text-mute">— {active.label.toLowerCase()}</p>
          <h2 className="mt-1 font-serif text-xl text-ink">{active.label}</h2>
          <p className="mt-1 text-sm text-mute">{active.description}</p>
        </header>

        {activeId === "reply_to_guest" ? (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-ink">
              Guest message
              <textarea
                rows={5}
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                placeholder="Paste what the guest sent…"
                className="mt-1 w-full resize-none rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </label>
            <label className="block text-sm font-semibold text-ink">
              Booking reference <span className="font-normal text-mute">(optional)</span>
              <input
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="e.g. clxyz1234…"
                className="mt-1 w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </label>
          </div>
        ) : null}

        {activeId === "ask" ? (
          <label className="block text-sm font-semibold text-ink">
            What do you need?
            <textarea
              rows={4}
              value={freePrompt}
              onChange={(e) => setFreePrompt(e.target.value)}
              placeholder="Summarise refunds this quarter / draft an apology to a noise complaint / suggest a price for a holiday week…"
              className="mt-1 w-full resize-none rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
        ) : null}

        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-ambient transition hover:bg-brand-pressed disabled:bg-stone disabled:shadow-none"
        >
          <Send className="h-4 w-4" />
          {running ? "Drafting…" : "Draft it"}
        </button>

        <a
          href="https://argens.xyz"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] tracking-wide text-mute hover:text-ink"
        >
          Powered by
          <img src="/argens-icon.svg" alt="" aria-hidden="true" width={11} height={12} className="opacity-80" />
          <span className="underline-offset-2 hover:underline">argens.xyz</span>
        </a>

        {result ? (
          <div className="space-y-3 rounded-md bg-surface-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-serif text-xs italic text-mute">— draft</p>
              <button
                type="button"
                onClick={copyDraft}
                className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-deep"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink">{result.draft}</pre>
            {result.actionLinks && result.actionLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {result.actionLinks.map((link) =>
                  link.href.startsWith("mailto:") ? (
                    <a
                      key={link.href + link.label}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-deep"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink hover:bg-surface-deep"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {link.label}
                    </Link>
                  )
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
