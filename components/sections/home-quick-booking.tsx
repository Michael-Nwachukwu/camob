"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays, Users, Home as HomeIcon, ArrowRight } from "lucide-react";
import type { ApartmentTypeId } from "@/lib/types";

export function HomeQuickBooking() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [apartmentTypeId, setApartmentTypeId] = useState<ApartmentTypeId>("one-bedroom");

  function handleSubmit() {
    const query = new URLSearchParams({ apartmentTypeId, guests });
    if (checkIn) query.set("checkIn", checkIn);
    if (checkOut) query.set("checkOut", checkOut);
    router.push(`/book?${query.toString()}`);
  }

  return (
    <section className="relative z-10 mx-auto mt-10 max-w-5xl px-4 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="relative rounded-lg bg-canvas p-5 shadow-scrim md:p-7"
      >
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-ambient">
          ✶ Live calendar
        </span>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_0.9fr_0.9fr_auto] md:items-end">
          <Field label="Check-in" icon={<CalendarDays className="h-4 w-4 text-mute" />}>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </Field>
          <Field label="Check-out" icon={<CalendarDays className="h-4 w-4 text-mute" />}>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </Field>
          <Field label="Guests" icon={<Users className="h-4 w-4 text-mute" />}>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            >
              <option value="1">1 guest</option>
              <option value="2">2 guests</option>
              <option value="3">3 guests</option>
              <option value="4">4 guests</option>
            </select>
          </Field>
          <Field label="Maisonette" icon={<HomeIcon className="h-4 w-4 text-mute" />}>
            <select
              value={apartmentTypeId}
              onChange={(e) => setApartmentTypeId(e.target.value as ApartmentTypeId)}
              className="w-full bg-transparent text-sm text-ink outline-none"
            >
              <option value="one-bedroom">1-Bedroom</option>
              <option value="two-bedroom">2-Bedroom</option>
            </select>
          </Field>
          <motion.button
            onClick={handleSubmit}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-colors hover:bg-brand-pressed"
          >
            See dates
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

function Field({
  label,
  icon,
  children
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-serif text-xs italic text-mute">{label}</span>
      <span className="mt-1 flex items-center gap-2 rounded-md bg-surface-card px-3 py-2.5 transition-colors focus-within:bg-surface-deep">
        {icon}
        {children}
      </span>
    </label>
  );
}
