"use client";

import { useState } from "react";
import { CalendarDays, Users, BedDouble } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ApartmentTypeId } from "@/lib/types";

export function HomeQuickBooking() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [apartmentTypeId, setApartmentTypeId] = useState<ApartmentTypeId>("one-bedroom");

  function handleSubmit() {
    const query = new URLSearchParams({
      apartmentTypeId,
      guests
    });

    if (checkIn) {
      query.set("checkIn", checkIn);
    }

    if (checkOut) {
      query.set("checkOut", checkOut);
    }

    router.push(`/book?${query.toString()}`);
  }

  return (
    <section className="relative z-20 mx-auto -mt-16 max-w-6xl px-6">
      <div className="rounded-[1.5rem] bg-white p-6 shadow-ambient md:p-8">
        <div className="grid gap-5 md:grid-cols-[1.3fr_0.8fr_0.9fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Dates</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-3">
                <CalendarDays className="h-4 w-4 text-secondary" />
                <input
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                  type="date"
                  className="w-full bg-transparent text-sm text-primary outline-none"
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-3">
                <CalendarDays className="h-4 w-4 text-secondary" />
                <input
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  type="date"
                  className="w-full bg-transparent text-sm text-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Guests</label>
            <div className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-3">
              <Users className="h-4 w-4 text-secondary" />
              <select
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="w-full bg-transparent text-sm text-primary outline-none"
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Unit Type</label>
            <div className="flex items-center gap-3 rounded-2xl bg-surface-low px-4 py-3">
              <BedDouble className="h-4 w-4 text-secondary" />
              <select
                value={apartmentTypeId}
                onChange={(event) => setApartmentTypeId(event.target.value as ApartmentTypeId)}
                className="w-full bg-transparent text-sm text-primary outline-none"
              >
                <option value="one-bedroom">1-Bedroom Suite</option>
                <option value="two-bedroom">2-Bedroom Executive</option>
              </select>
            </div>
          </div>

          <button onClick={handleSubmit} className="rounded-2xl bg-silk px-8 py-4 font-semibold text-white">
            Check Availability
          </button>
        </div>
      </div>
    </section>
  );
}
