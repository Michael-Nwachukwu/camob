"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Clock, X } from "lucide-react";
import {
  loadIncompleteBookings,
  removeIncompleteBooking,
  type IncompleteBooking
} from "@/lib/incomplete-bookings";
import { formatCurrency } from "@/lib/utils";

const DISMISSED_KEY = "camob:resume-dismissed";

function isDismissed(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (window.sessionStorage.getItem(DISMISSED_KEY) ?? "").split(",").includes(id);
  } catch {
    return false;
  }
}

function dismiss(id: string) {
  if (typeof window === "undefined") return;
  try {
    const ids = new Set((window.sessionStorage.getItem(DISMISSED_KEY) ?? "").split(",").filter(Boolean));
    ids.add(id);
    window.sessionStorage.setItem(DISMISSED_KEY, [...ids].join(","));
  } catch {
    // Non-fatal — pill just won't stay dismissed.
  }
}

function msLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return new Date(expiresAt).getTime() - Date.now();
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ResumeBookingPill() {
  const pathname = usePathname();
  const [resumable, setResumable] = useState<IncompleteBooking | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Re-check the server on mount and whenever the route changes (e.g. landing
  // on /booking/success after paying), so a finished booking stops nagging.
  const refresh = useCallback(async () => {
    const saved = loadIncompleteBookings();
    if (saved.length === 0) {
      setResumable(null);
      return;
    }

    const checks = await Promise.all(
      saved.map(async (b) => {
        try {
          const res = await fetch(`/api/bookings/${b.id}?token=${b.token}`, { cache: "no-store" });
          if (res.status === 404) {
            removeIncompleteBooking(b.id);
            return null;
          }
          if (!res.ok) return b; // transient error — keep the local entry
          const status = await res.json();
          const stillOwed = status.status === "pending_payment" && status.paymentStatus !== "paid";
          if (!stillOwed) {
            removeIncompleteBooking(b.id);
            return null;
          }
          // Trust the server's expiry over whatever we cached.
          return { ...b, expiresAt: status.expiresAt ?? b.expiresAt };
        } catch {
          return b;
        }
      })
    );

    const live = checks.filter((b): b is IncompleteBooking => b !== null && !isDismissed(b.id));
    // Surface the most urgent (soonest to expire) when more than one is open.
    live.sort((a, b) => (new Date(a.expiresAt ?? 0).getTime()) - (new Date(b.expiresAt ?? 0).getTime()));
    setResumable(live[0] ?? null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  // Tick once a second to drive the countdown.
  useEffect(() => {
    if (!resumable?.expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [resumable?.expiresAt]);

  if (!resumable) return null;

  const remaining = msLeft(resumable.expiresAt);
  // Expired locally before the server caught up — drop it and bail.
  if (remaining !== null && remaining <= 0) {
    removeIncompleteBooking(resumable.id);
    return null;
  }

  void now; // re-render trigger for the countdown

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="fixed bottom-5 left-5 z-40 md:bottom-7 md:left-7"
      >
        <div className="relative flex items-center gap-3 rounded-full bg-brand py-2 pl-3 pr-10 text-white shadow-scrim">
          <span className="absolute inset-0 -z-10 animate-bounce rounded-full bg-brand opacity-20" />
          <a
            href={`/booking/${resumable.id}?token=${resumable.token}`}
            className="flex items-center gap-3"
            aria-label="Finish your pending booking"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Clock className="h-4 w-4" />
            </span>
            <span className="pr-1">
              <span className="block text-[13px] font-bold leading-tight">Finish your booking</span>
              <span className="block text-[11px] leading-tight text-white/80">
                {resumable.apartmentName} · {formatCurrency(resumable.total)}
                {remaining !== null ? ` · ${formatCountdown(remaining)} left` : ""}
              </span>
            </span>
          </a>
          <button
            type="button"
            onClick={() => {
              dismiss(resumable.id);
              setResumable(null);
            }}
            aria-label="Dismiss"
            className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/70 hover:bg-white/15 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
