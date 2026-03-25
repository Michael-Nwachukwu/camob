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

  return (
    <div className="rounded-[2rem] bg-white p-6 shadow-ambient">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{apartmentTypeId.replace("-", " ")}</p>
          <h3 className="mt-2 font-serif text-3xl text-primary">{format(referenceMonth, "MMMM yyyy")}</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(format(addMonths(referenceMonth, -1), "yyyy-MM-dd"))}
            className="rounded-full border border-outline p-2 text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(format(addMonths(referenceMonth, 1), "yyyy-MM-dd"))}
            className="rounded-full border border-outline p-2 text-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
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

          return (
            <button
              key={isoDate}
              type="button"
              disabled={blocked}
              onClick={() => onDateSelect(isoDate)}
              className={cn(
                "min-h-16 rounded-2xl border px-2 py-3 text-left transition",
                blocked && "cursor-not-allowed border-transparent bg-surface-low text-muted/50",
                day?.status === "partial" && "border-secondary/30 bg-secondary-fixed/40 text-primary",
                day?.status === "available" &&
                  "border-transparent bg-surface-low text-primary hover:shadow-[0_0_0_2px_rgba(119,90,25,0.28)]",
                selected && "border-transparent bg-primary text-white"
              )}
            >
              <div className="text-sm font-semibold">{index + 1}</div>
              <div className={cn("mt-2 text-[10px]", selected ? "text-white/80" : "text-muted")}>
                {day ? `${day.remainingUnits} left` : ""}
              </div>
              <div className={cn("text-[10px]", selected ? "text-white/90" : "text-secondary")}>
                {day ? formatCurrency(day.price) : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
