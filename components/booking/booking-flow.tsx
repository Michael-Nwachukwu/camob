"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { apartmentTypes, siteCopy } from "@/lib/data/camob";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import type { ApartmentTypeId, BookingQuote, UnitAvailabilityDay } from "@/lib/types";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/utils";

type SubmissionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function BookingFlow({
  initialApartmentTypeId,
  initialCheckIn,
  initialCheckOut,
  initialGuests
}: {
  initialApartmentTypeId?: ApartmentTypeId;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}) {
  const [apartmentTypeId, setApartmentTypeId] = useState<ApartmentTypeId>(initialApartmentTypeId ?? "one-bedroom");
  const [month, setMonth] = useState(initialCheckIn ?? format(new Date(), "yyyy-MM-dd"));
  const [days, setDays] = useState<UnitAvailabilityDay[]>([]);
  const [checkIn, setCheckIn] = useState<string | undefined>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string | undefined>(initialCheckOut);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank_transfer">("paystack");
  const [holdId, setHoldId] = useState<string>();
  const [formState, setFormState] = useState<SubmissionState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const query = new URLSearchParams({ apartmentTypeId, month });
      const response = await fetch(`/api/availability?${query.toString()}`);
      const payload = await response.json();
      setDays(payload.days ?? []);
    });
  }, [apartmentTypeId, month]);

  const apartment = apartmentTypes.find((item) => item.id === apartmentTypeId)!;

  const quote: BookingQuote | null = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return null;
    }

    const nights = nightsBetween(checkIn, checkOut);
    const subtotal = nights * apartment.ratePerNight;
    return {
      apartmentTypeId,
      nights,
      nightlyRate: apartment.ratePerNight,
      subtotal,
      serviceCharge: 15000,
      total: subtotal + 15000
    };
  }, [apartment.ratePerNight, apartmentTypeId, checkIn, checkOut]);

  function handleDateSelect(value: string) {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(value);
      setCheckOut(undefined);
      return;
    }

    if (value <= checkIn) {
      setCheckIn(value);
      setCheckOut(undefined);
      return;
    }

    setCheckOut(value);
  }

  async function holdDates(guestCount = 2) {
    if (!checkIn || !checkOut) {
      setFormState({ status: "error", message: "Select both check-in and check-out dates first." });
      return null;
    }

    const response = await fetch("/api/booking-holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apartmentTypeId,
        checkIn,
        checkOut,
        guests: guestCount
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setFormState({ status: "error", message: payload.error ?? "Unable to create a reservation hold." });
      return null;
    }

    setHoldId(payload.hold.id);
    setFormState({ status: "success", message: "Dates held for 15 minutes. Complete your booking below." });
    return payload.hold.id as string;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const guestCount = Number(formData.get("guests"));

    if (!checkIn || !checkOut) {
      setFormState({ status: "error", message: "Please pick a valid stay window." });
      return;
    }

    const resolvedHoldId = holdId ?? (await holdDates(guestCount));
    if (!resolvedHoldId) {
      return;
    }

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holdId: resolvedHoldId,
        apartmentTypeId,
        checkIn,
        checkOut,
        paymentMethod,
        guest: {
          fullName: formData.get("fullName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          guests: Number(formData.get("guests")),
          specialRequests: formData.get("specialRequests")
        }
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setFormState({ status: "error", message: payload.error ?? "Could not finalize the booking." });
      return;
    }

    if (paymentMethod === "paystack") {
      const paystackResponse = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: payload.booking.id,
          email: payload.booking.guest.email
        })
      });

      const paystackPayload = await paystackResponse.json();
      if (paystackPayload.authorizationUrl) {
        window.location.href = paystackPayload.authorizationUrl;
        return;
      }
    }

    window.location.href = `/booking/success?bookingId=${payload.booking.id}`;
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-40 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Booking & Availability</p>
          <h1 className="mt-4 font-serif text-5xl text-primary">Secure your Camob stay.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            Choose your apartment type, select open dates, and complete your reservation with instant hold protection.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-ambient">
          <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Apartment Type</label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {apartmentTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setApartmentTypeId(item.id);
                  setCheckIn(undefined);
                  setCheckOut(undefined);
                  setHoldId(undefined);
                }}
                className={`rounded-[1.5rem] border p-5 text-left ${
                  apartmentTypeId === item.id ? "border-primary bg-primary text-white" : "border-outline bg-surface-low text-primary"
                }`}
              >
                <p className="font-serif text-2xl">{item.shortName}</p>
                <p className={`mt-2 text-sm ${apartmentTypeId === item.id ? "text-white/80" : "text-muted"}`}>
                  {formatCurrency(item.ratePerNight)} per night • up to {item.maxGuests} guests
                </p>
              </button>
            ))}
          </div>
        </div>

        <AvailabilityCalendar
          apartmentTypeId={apartmentTypeId}
          days={days}
          checkIn={checkIn}
          checkOut={checkOut}
          onMonthChange={setMonth}
          onDateSelect={handleDateSelect}
        />

        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white p-8 shadow-ambient">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Full name</label>
              <input name="fullName" required className="mt-2 w-full rounded-2xl border border-outline bg-surface-low px-4 py-3" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Email</label>
              <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-outline bg-surface-low px-4 py-3" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Phone</label>
              <input name="phone" required className="mt-2 w-full rounded-2xl border border-outline bg-surface-low px-4 py-3" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Guests</label>
              <select
                name="guests"
                defaultValue={initialGuests ?? Math.min(2, apartment.maxGuests)}
                className="mt-2 w-full rounded-2xl border border-outline bg-surface-low px-4 py-3"
              >
                {Array.from({ length: apartment.maxGuests }).map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} guest{index + 1 > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Special requests</label>
              <textarea
                name="specialRequests"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-outline bg-surface-low px-4 py-3"
                placeholder="Late check-in, airport pickup, or anything the team should prepare."
              />
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("paystack")}
              className={`rounded-[1.5rem] border p-4 text-left ${
                paymentMethod === "paystack" ? "border-primary bg-primary text-white" : "border-outline bg-surface-low text-primary"
              }`}
            >
              <p className="font-semibold">Paystack</p>
              <p className={`mt-2 text-sm ${paymentMethod === "paystack" ? "text-white/80" : "text-muted"}`}>
                Card or supported online payment.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("bank_transfer")}
              className={`rounded-[1.5rem] border p-4 text-left ${
                paymentMethod === "bank_transfer" ? "border-primary bg-primary text-white" : "border-outline bg-surface-low text-primary"
              }`}
            >
              <p className="font-semibold">Bank Transfer</p>
              <p className={`mt-2 text-sm ${paymentMethod === "bank_transfer" ? "text-white/80" : "text-muted"}`}>
                Reserve now and let staff verify your transfer.
              </p>
            </button>
          </div>

          {formState.status !== "idle" ? (
            <div
              className={`mt-6 rounded-2xl px-4 py-3 text-sm ${
                formState.status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {formState.message}
            </div>
          ) : null}

          <button disabled={isPending} className="mt-8 inline-flex rounded-full bg-silk px-6 py-4 font-semibold text-white">
            {paymentMethod === "paystack" ? "Continue to payment" : "Reserve with bank transfer"}
          </button>
        </form>
      </div>

      <aside className="lg:pt-14">
        <div className="sticky top-28 rounded-[2rem] bg-primary p-8 text-white shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary-fixed">Reservation Summary</p>
          <h2 className="mt-4 font-serif text-3xl">{apartment.name}</h2>
          <p className="mt-3 text-sm leading-7 text-white/80">{apartment.description}</p>

          <div className="mt-8 rounded-[1.75rem] bg-white/10 p-6">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-white/75">Check-in</span>
                <span>{checkIn ? formatDate(checkIn) : "Select date"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/75">Check-out</span>
                <span>{checkOut ? formatDate(checkOut) : "Select date"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/75">Policy</span>
                <span>{siteCopy.checkIn} / {siteCopy.checkOut}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 rounded-[1.75rem] bg-white p-6 text-primary">
            {quote ? (
              <>
                <div className="flex justify-between text-sm text-muted">
                  <span>
                    {formatCurrency(quote.nightlyRate)} x {quote.nights} night{quote.nights > 1 ? "s" : ""}
                  </span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Service charge</span>
                  <span>{formatCurrency(quote.serviceCharge)}</span>
                </div>
                <div className="border-t border-outline pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm leading-7 text-muted">
                Pick your dates to see the live quote and create a reservation hold.
              </p>
            )}
          </div>

          <div className="mt-8 rounded-[1.75rem] bg-white/10 p-6 text-sm text-white/80">
            Holds last 15 minutes. Paystack bookings remain pending until webhook confirmation, while bank transfer reservations are surfaced to staff for manual review.
          </div>
        </div>
      </aside>
    </div>
  );
}
