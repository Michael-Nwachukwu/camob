"use client";

import { addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { ApartmentTypeId, UnitAvailabilityDay } from "@/lib/types";

interface AvailabilityCalendarProps {
  apartmentTypeId: ApartmentTypeId;
  days: UnitAvailabilityDay[];
  checkIn?: string;
  checkOut?: string;
  onMonthChange: (value: string) => void;
  onDateSelect: (value: string) => void;
}

export function AvailabilityCalendar({
  apartmentTypeId,
  days,
  checkIn,
  checkOut,
  onMonthChange,
  onDateSelect
}: AvailabilityCalendarProps) {
  const referenceMonth = days[0]?.date ? startOfMonth(parseISO(days[0].date)) : startOfMonth(new Date());
  const firstWeekday = referenceMonth.getDay();
  const placeholders = Array.from({ length: firstWeekday });
  const monthEnd = endOfMonth(referenceMonth).getDate();
  const stateByDate = new Map(days.map((day) => [day.date, day]));
  const labelType = apartmentTypeId === "one-bedroom" ? "1-Bedroom Maisonette" : "2-Bedroom Maisonette";

  return (
    <div className="rounded-md bg-canvas p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">{labelType}</p>
          <h3 className="mt-1 text-2xl font-semibold text-ink">
            {format(referenceMonth, "MMMM yyyy")}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonthChange(format(addMonths(referenceMonth, -1), "yyyy-MM-dd"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink hover:bg-surface-deep"
          >
            <ChevronLeft className="h-4 w-4 text-brand" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onMonthChange(format(addMonths(referenceMonth, 1), "yyyy-MM-dd"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink hover:bg-surface-deep"
          >
            <ChevronRight className="h-4 w-4 text-brand" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-mute">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day} className="py-1">{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {placeholders.map((_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {Array.from({ length: monthEnd }).map((_, index) => {
          const isoDate = format(new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), index + 1), "yyyy-MM-dd");
          const day = stateByDate.get(isoDate);
          const selected =
            (checkIn && isoDate === checkIn) ||
            (checkOut && isoDate === checkOut) ||
            (checkIn && checkOut && isoDate > checkIn && isoDate < checkOut);
          const blocked = !day || ["booked", "blocked", "past"].includes(day.status);
          const isEdge = isoDate === checkIn || isoDate === checkOut;

          return (
            <button
              key={isoDate}
              type="button"
              disabled={blocked}
              onClick={() => onDateSelect(isoDate)}
              className={cn(
                "min-h-[46px] sm:min-h-[68px] rounded-md px-2 py-2 text-center sm:text-left transition-colors",
                blocked && "cursor-not-allowed bg-transparent text-ash line-through decoration-stone",
                !blocked && !selected && day?.status === "available" && "bg-surface-card hover:bg-surface-deep text-ink",
                !blocked && !selected && day?.status === "partial" && "bg-surface-card hover:bg-surface-deep text-ink ring-1 ring-stone",
                selected && !isEdge && "bg-ink/10 text-ink",
                isEdge && "bg-ink text-canvas"
              )}
            >
              <div className="text-sm font-bold">{index + 1}</div>
              {/* <div className={cn(
                "mt-1 text-[10px] font-semibold",
                isEdge ? "text-canvas/80" : selected ? "text-ink/70" : "text-mute"
              )}>
                {day ? `${day.remainingUnits} left` : ""}
              </div> */}
              <div className={cn(
                "text-[10px] mt-2 hidden sm:block",
                isEdge ? "text-canvas/80" : "text-mute"
              )}>
                {day ? formatCurrency(day.price) : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-mute">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-surface-card ring-1 ring-hairline" /> Open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-surface-card ring-1 ring-stone" /> One unit left
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-ink" /> Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-transparent ring-1 ring-hairline" /> Booked
        </span>
      </div>
    </div>
  );
}
