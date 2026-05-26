"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { apartmentTypes } from "@/lib/data/camob";
import type { ActionResult } from "@/components/admin/action-form";
import type { ApartmentTypeId, UnitAvailabilityDay } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type Props = {
  createBlackout: (formData: FormData) => Promise<ActionResult>;
};

export function AdminBlackoutCalendar({ createBlackout }: Props) {
  const router = useRouter();
  const [apartmentTypeId, setApartmentTypeId] = useState<ApartmentTypeId>("one-bedroom");
  const [monthAnchor, setMonthAnchor] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [days, setDays] = useState<UnitAvailabilityDay[]>([]);
  const [start, setStart] = useState<string>();
  const [end, setEnd] = useState<string>();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const query = new URLSearchParams({ apartmentTypeId, month: monthAnchor });
      const response = await fetch(`/api/availability?${query.toString()}`);
      const payload = await response.json();
      setDays(payload.days ?? []);
    });
  }, [apartmentTypeId, monthAnchor]);

  function handleDayClick(iso: string, blocked: boolean) {
    if (blocked) return;
    if (!start || (start && end)) {
      setStart(iso);
      setEnd(undefined);
      return;
    }
    if (iso === start) {
      setStart(undefined);
      setEnd(undefined);
      return;
    }
    if (iso < start) {
      setStart(iso);
      setEnd(undefined);
      return;
    }
    setEnd(iso);
  }

  async function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError(null);
    if (!start || !end) {
      setError("Click a start and end date on the calendar.");
      return;
    }
    if (!reason.trim()) {
      setError("Add a reason — even just 'owner stay' helps later you.");
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading("Blocking dates…");
    try {
      const formData = new FormData();
      formData.set("apartmentTypeId", apartmentTypeId);
      formData.set("startDate", start);
      formData.set("endDate", end);
      formData.set("reason", reason.trim());
      const result = await createBlackout(formData);
      if (result.ok) {
        toast.success(result.message ?? "Dates blocked.", { id: toastId });
        setStart(undefined);
        setEnd(undefined);
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error, { id: toastId });
        setError(result.error);
      }
    } catch {
      toast.error("Couldn't save that blackout.", { id: toastId });
      setError("Couldn't save that blackout.");
    } finally {
      setSubmitting(false);
    }
  }

  const referenceMonth = days[0]?.date ? startOfMonth(parseISO(days[0].date)) : startOfMonth(parseISO(monthAnchor));
  const firstWeekday = referenceMonth.getDay();
  const placeholders = Array.from({ length: firstWeekday });
  const monthEnd = endOfMonth(referenceMonth).getDate();
  const dayByDate = new Map(days.map((day) => [day.date, day]));
  const apartment = apartmentTypes.find((item) => item.id === apartmentTypeId)!;

  return (
    <form onSubmit={onSubmit} className="rounded-lg bg-canvas p-6 shadow-ambient md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-serif text-sm italic text-mute">— add a blackout</p>
          <h3 className="mt-1 font-serif text-xl text-ink">Pick a window</h3>
        </div>
        <select
          value={apartmentTypeId}
          onChange={(e) => {
            setApartmentTypeId(e.target.value as ApartmentTypeId);
            setStart(undefined);
            setEnd(undefined);
          }}
          className="h-10 rounded-full bg-surface-card px-4 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {apartmentTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.shortName} Maisonette
            </option>
          ))}
        </select>
      </div>

      {/* Month nav */}
      <div className="mt-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{apartment.shortName}</p>
          <h4 className="mt-1 font-serif text-2xl text-ink">{format(referenceMonth, "MMMM yyyy")}</h4>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthAnchor(format(addMonths(referenceMonth, -1), "yyyy-MM-dd"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink hover:bg-surface-deep"
          >
            <ChevronLeft className="h-4 w-4 text-brand" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthAnchor(format(addMonths(referenceMonth, 1), "yyyy-MM-dd"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink hover:bg-surface-deep"
          >
            <ChevronRight className="h-4 w-4 text-brand" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <span key={label} className="py-1">{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {placeholders.map((_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {Array.from({ length: monthEnd }).map((_, index) => {
          const iso = format(
            new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), index + 1),
            "yyyy-MM-dd"
          );
          const day = dayByDate.get(iso);
          const selected =
            (start && iso === start) ||
            (end && iso === end) ||
            (start && end && iso > start && iso < end);
          const isEdge = iso === start || iso === end;
          const blocked = !day || day.status === "past" || day.status === "booked" || day.status === "blocked";
          const isAlreadyBlocked = day?.status === "blocked";

          return (
            <button
              key={iso}
              type="button"
              disabled={blocked}
              onClick={() => handleDayClick(iso, blocked)}
              title={isAlreadyBlocked ? "Already blocked" : day?.status === "booked" ? "Booked" : ""}
              className={cn(
                "relative min-h-[44px] rounded-md px-2 py-2 text-left transition-colors",
                blocked && "cursor-not-allowed bg-transparent text-ash",
                isAlreadyBlocked && "bg-surface-card ring-1 ring-danger/30",
                !blocked && !selected && day?.status === "available" && "bg-surface-card hover:bg-surface-deep text-ink",
                !blocked && !selected && day?.status === "partial" && "bg-surface-card hover:bg-surface-deep text-ink ring-1 ring-stone",
                selected && !isEdge && "bg-ink/10 text-ink",
                isEdge && "bg-ink text-canvas"
              )}
            >
              <span className="text-sm font-bold">{index + 1}</span>
              {isAlreadyBlocked ? (
                <CalendarOff className="absolute right-1.5 top-1.5 h-3 w-3 text-danger" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-mute">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-surface-card ring-1 ring-hairline" /> Open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-surface-card ring-1 ring-stone" /> One unit left
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-ink" /> Picked
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-surface-card ring-1 ring-danger/30" /> Already blocked
        </span>
      </div>

      {/* Range summary */}
      <div className="mt-5 rounded-md bg-surface-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Selected window</p>
        {start && end ? (
          <p className="mt-1 font-serif text-base text-ink">
            {formatDate(start)} → {formatDate(end)}
          </p>
        ) : start ? (
          <p className="mt-1 font-serif text-base italic text-mute">
            {formatDate(start)} → <span className="text-ink">pick the end</span>
          </p>
        ) : (
          <p className="mt-1 font-serif text-base italic text-mute">Tap a start date on the calendar.</p>
        )}
      </div>

      {/* Reason */}
      <div className="mt-5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Owner stay, deep clean, plumbing work…"
          className="mt-1.5 w-full rounded-md bg-canvas px-3 py-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-surface-card px-4 py-3 text-sm text-danger ring-1 ring-danger/20">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !start || !end || !reason.trim()}
        className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed disabled:translate-y-0 disabled:bg-stone disabled:shadow-none"
      >
        {submitting ? "Saving…" : "Block these dates"}
      </button>
    </form>
  );
}
