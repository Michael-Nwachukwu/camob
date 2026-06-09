"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MessageCircle, Send, X } from "lucide-react";
import { siteCopy } from "@/lib/data/camob";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content: "Hi — ask me anything about the maisonettes, the neighbourhood, or how booking works. For dates and prices, I'll point you to the booking page."
};

export function ConciergePanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const response = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) })
      });
      const payload = await response.json();
      const reply: string = payload.reply ?? "Couldn't reach the concierge — please try again or message us on WhatsApp.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Couldn't reach the concierge — please try again or message us on WhatsApp." }
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-hairline bg-canvas shadow-scrim md:bottom-28 md:right-7"
      role="dialog"
      aria-label="Concierge chat"
    >
      <header className="flex items-center justify-between border-b border-hairline bg-surface-card px-4 py-3">
        <div>
          <p className="font-serif text-xs italic text-mute">— concierge</p>
          <p className="font-serif text-base text-ink">Ask about the stay</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close concierge"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mute hover:bg-canvas hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-md bg-brand px-3 py-2 text-sm leading-relaxed text-white"
                  : "max-w-[85%] rounded-md bg-surface-card px-3 py-2 text-sm leading-relaxed text-ink"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-md bg-surface-card px-3 py-2 text-sm italic text-mute">…thinking</div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-hairline px-3 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about check-in, the neighbourhood, anything…"
            className="max-h-32 flex-1 resize-none rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="button"
            onClick={send}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-ambient transition hover:bg-brand-pressed disabled:bg-stone disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <a
          href={siteCopy.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-center gap-2 rounded-sm bg-surface-card py-2 text-xs font-bold text-ink hover:bg-surface-deep"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Reach out on WhatsApp
        </a>
        <a
          href="https://argens.xyz"
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center justify-center gap-1.5 text-[10px] tracking-wide text-mute hover:text-ink"
        >
          Powered by
          <img src="/argens-icon.svg" alt="" aria-hidden="true" width={10} height={11} className="opacity-80" />
          <span className="underline-offset-2 hover:underline">argens.xyz</span>
        </a>
      </div>
    </motion.div>
  );
}
