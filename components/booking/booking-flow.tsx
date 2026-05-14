"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { CreditCard, Landmark, AlertCircle, CheckCircle2 } from "lucide-react";
import { apartmentTypes } from "@/lib/data/camob";
import { AvailabilityCalendar } from "@/components/booking/availability-calendar";
import type { ApartmentTypeId, BookingQuote, UnitAvailabilityDay } from "@/lib/types";
import { cn, formatCurrency, formatDate, nightsBetween } from "@/lib/utils";

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
  const [submitting, setSubmitting] = useState(false);

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
    if (!checkIn || !checkOut || checkOut <= checkIn) return null;
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

  const discount = useMemo(() => {
    if (!quote) return null;
    if (quote.nights >= 28) return { pct: 7, label: "Monthly stay" };
    if (quote.nights >= 5) return { pct: 5, label: "5+ night stay" };
    return null;
  }, [quote]);

  const discountAmount = quote && discount ? Math.round((quote.subtotal * discount.pct) / 100) : 0;
  const finalTotal = quote ? quote.total - discountAmount : 0;

  function handleDateSelect(value: string) {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(value);
      setCheckOut(undefined);
      setHoldId(undefined);
      return;
    }
    if (value <= checkIn) {
      setCheckIn(value);
      setCheckOut(undefined);
      setHoldId(undefined);
      return;
    }
    setCheckOut(value);
  }

  async function holdDates(guestCount = 2) {
    if (!checkIn || !checkOut) {
      setFormState({ status: "error", message: "Pick a check-in and check-out first." });
      return null;
    }
    const response = await fetch("/api/booking-holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apartmentTypeId, checkIn, checkOut, guests: guestCount })
    });
    const payload = await response.json();
    if (!response.ok) {
      setFormState({ status: "error", message: payload.error ?? "Couldn't hold those dates." });
      return null;
    }
    setHoldId(payload.hold.id);
    setFormState({ status: "success", message: "Held for 15 minutes. Finish up below to keep it." });
    return payload.hold.id as string;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const guestCount = Number(formData.get("guests"));

    if (!checkIn || !checkOut) {
      setFormState({ status: "error", message: "Pick a valid stay window." });
      setSubmitting(false);
      return;
    }

    const resolvedHoldId = holdId ?? (await holdDates(guestCount));
    if (!resolvedHoldId) {
      setSubmitting(false);
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
          guests: guestCount,
          specialRequests: formData.get("specialRequests")
        }
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setFormState({ status: "error", message: payload.error ?? "Couldn't finalise the booking." });
      setSubmitting(false);
      return;
    }

    if (paymentMethod === "paystack") {
      const paystackResponse = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: payload.booking.id, email: payload.booking.guest.email })
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
    <div className="relative pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="font-serif text-sm italic text-mute">— check availability</p>
        <h1 className="mt-3 max-w-3xl font-serif text-[36px] leading-[1.05] text-ink md:text-[64px]" style={{ letterSpacing: "-1.4px" }}>
          Pick your dates.
          <br />
          <span className="italic text-brand">We'll hold the unit</span> while you finish up.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-[1.6] text-body md:text-lg">
          Holds last 15 minutes. Paystack confirms instantly; bank transfers go to
          us for a quick manual check.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {/* Unit picker */}
          <div className="rounded-lg bg-canvas p-6 shadow-ambient md:p-7">
            <p className="font-serif text-sm italic text-mute">— which maisonette?</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {apartmentTypes.map((item) => {
                const active = apartmentTypeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setApartmentTypeId(item.id);
                      setCheckIn(undefined);
                      setCheckOut(undefined);
                      setHoldId(undefined);
                      setFormState({ status: "idle" });
                    }}
                    className={cn(
                      "rounded-md p-5 text-left transition-all hover:-translate-y-0.5",
                      active ? "bg-red-700 text-canvas shadow-ambient" : "bg-surface-card text-ink hover:bg-surface-deep"
                    )}
                  >
                    <p className="font-serif text-xl">{item.shortName} Maisonette</p>
                    <p className={cn("mt-1 text-sm", active ? "text-canvas/75" : "text-mute")}>
                      {formatCurrency(item.ratePerNight)} / night · up to {item.maxGuests} guests
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar */}
          <AvailabilityCalendar
            apartmentTypeId={apartmentTypeId}
            days={days}
            checkIn={checkIn}
            checkOut={checkOut}
            onMonthChange={setMonth}
            onDateSelect={handleDateSelect}
          />

          {/* Guest form */}
          <form onSubmit={handleSubmit} className="rounded-lg bg-canvas p-6 shadow-ambient md:p-8">
            <p className="font-serif text-sm italic text-mute">— your details</p>
            <h2 className="mt-1 font-serif text-3xl text-ink" style={{ letterSpacing: "-0.6px" }}>Just the basics</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <FormField name="fullName" label="Full name" required />
              <FormField name="email" label="Email" type="email" required />
              <FormField name="phone" label="Phone (with country code)" required placeholder="+234…" />
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">Guests</label>
                <select
                  name="guests"
                  defaultValue={initialGuests ?? Math.min(2, apartment.maxGuests)}
                  className="mt-1.5 h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
                >
                  {Array.from({ length: apartment.maxGuests }).map((_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1} guest{index + 1 > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
                  Anything we should know? (optional)
                </label>
                <textarea
                  name="specialRequests"
                  rows={3}
                  className="mt-1.5 w-full rounded-md bg-canvas px-3 py-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
                  placeholder="Late flight, early breakfast, picking up the keys for a parent…"
                />
              </div>
            </div>

            <div>
              {/* Payment */}
              <div className="mt-8">
                <p className="font-serif text-sm italic text-mute">— how you'd like to pay</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <PaymentOption
                    active={paymentMethod === "paystack"}
                    onClick={() => setPaymentMethod("paystack")}
                    icon={<CreditCard className="h-5 w-5" />}
                    title="Paystack"
                    note="Card or bank app. Confirms the booking instantly."
                  />
                  <PaymentOption
                    active={paymentMethod === "bank_transfer"}
                    onClick={() => setPaymentMethod("bank_transfer")}
                    icon={<Landmark className="h-5 w-5" />}
                    title="Bank transfer"
                    note="We'll send account details and check it in a few hours."
                  />
                </div>
              </div>

              {formState.status !== "idle" ? (
                <div
                  className={cn(
                    "mt-6 flex items-start gap-2 rounded-md px-4 py-3 text-sm",
                    formState.status === "success"
                      ? "bg-success-pale text-success"
                      : "bg-surface-card text-danger ring-1 ring-danger/20"
                  )}
                >
                  {formState.status === "success"
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  <span>{formState.message}</span>
                </div>
              ) : null}

              <button
                disabled={isPending || submitting}
                className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-7 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed disabled:translate-y-0 disabled:bg-stone disabled:shadow-none"
              >
                {submitting
                  ? "Working on it…"
                  : paymentMethod === "paystack" ? "Continue to payment →" : "Reserve with bank transfer →"}
              </button>
            </div>

          </form>
        </div>

        {/* Summary aside */}
        <aside>
          <div className="sticky top-24 rounded-lg bg-canvas p-7 shadow-scrim md:p-8">
            <p className="font-serif text-sm italic text-mute">— your stay</p>
            <h2 className="mt-1 font-serif text-2xl text-ink" style={{ letterSpacing: "-0.4px" }}>{apartment.name}</h2>

            <div className="mt-5 space-y-2.5 text-sm">
              <SummaryRow label="Check-in" value={checkIn ? formatDate(checkIn) : "—"} />
              <SummaryRow label="Check-out" value={checkOut ? formatDate(checkOut) : "—"} />
              <SummaryRow label="Nights" value={quote ? `${quote.nights}` : "—"} />
            </div>

            <hr className="my-5 border-hairline-soft" />

            <div className="space-y-2.5 text-sm">
              {quote ? (
                <>
                  <SummaryRow
                    label={`${formatCurrency(quote.nightlyRate)} × ${quote.nights} night${quote.nights > 1 ? "s" : ""}`}
                    value={formatCurrency(quote.subtotal)}
                  />
                  <SummaryRow label="Service charge" value={formatCurrency(quote.serviceCharge)} />
                  {discount ? (
                    <SummaryRow
                      label={`${discount.label} (−${discount.pct}%)`}
                      value={`−${formatCurrency(discountAmount)}`}
                      tone="success"
                    />
                  ) : null}
                </>
              ) : (
                <p className="text-sm leading-[1.6] text-mute">
                  Pick check-in and check-out on the calendar to see the total.
                </p>
              )}
            </div>

            {quote ? (
              <>
                <hr className="my-5 border-hairline-soft" />
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-base italic text-ink">Total</span>
                  <span className="font-serif text-3xl text-ink">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </>
            ) : null}

            <div className="mt-6 rounded-md bg-surface-card p-4 text-xs leading-[1.6] text-mute">
              We hold the unit for 15 minutes once you submit. Paystack confirms
              automatically; bank transfer waits for a quick manual check.
            </div>

            <div className="hidden sm:block">
              {/* Payment */}
              <div className="mt-8">
                <p className="font-serif text-sm italic text-mute">— how you'd like to pay</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <PaymentOption
                    active={paymentMethod === "paystack"}
                    onClick={() => setPaymentMethod("paystack")}
                    icon={<CreditCard className="h-5 w-5" />}
                    title="Paystack"
                    note="Card or bank app. Confirms the booking instantly."
                  />
                  <PaymentOption
                    active={paymentMethod === "bank_transfer"}
                    onClick={() => setPaymentMethod("bank_transfer")}
                    icon={<Landmark className="h-5 w-5" />}
                    title="Bank transfer"
                    note="We'll send account details and check it in a few hours."
                  />
                </div>
              </div>

              {formState.status !== "idle" ? (
                <div
                  className={cn(
                    "mt-6 flex items-start gap-2 rounded-md px-4 py-3 text-sm",
                    formState.status === "success"
                      ? "bg-success-pale text-success"
                      : "bg-surface-card text-danger ring-1 ring-danger/20"
                  )}
                >
                  {formState.status === "success"
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  <span>{formState.message}</span>
                </div>
              ) : null}

              <button
                disabled={isPending || submitting}
                className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-7 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed disabled:translate-y-0 disabled:bg-stone disabled:shadow-none"
              >
                {submitting
                  ? "Working on it…"
                  : paymentMethod === "paystack" ? "Continue to payment →" : "Reserve with bank transfer →"}
              </button>
            </div>


          </div>
        </aside>
      </div>
    </div>
  );
}

function FormField({
  name,
  label,
  type = "text",
  required,
  placeholder
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
      />
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  note
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md p-4 text-left transition-colors",
        active ? "bg-ink text-canvas" : "bg-surface-card text-ink hover:bg-surface-deep"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-base font-semibold">{title}</p>
      </div>
      <p className={cn("mt-1.5 text-sm", active ? "text-canvas/75" : "text-mute")}>{note}</p>
    </button>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-mute">{label}</span>
      <span className={cn("font-semibold", tone === "success" ? "text-success" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}
