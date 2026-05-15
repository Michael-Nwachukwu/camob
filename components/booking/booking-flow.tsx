"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { CreditCard, Landmark, AlertCircle, CheckCircle2, ChevronLeft } from "lucide-react";
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
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(
    initialCheckIn && initialCheckOut ? 3 : initialApartmentTypeId ? 2 : 1
  );
  const formRef = useRef<HTMLFormElement>(null);

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
  const canProceedFromStep2 = !!checkIn && !!checkOut;

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

  // On mobile: show only the active step's section. On lg+: always show everything.
  function stepVis(target: 1 | 2 | 3) {
    return mobileStep === target ? "block" : "hidden lg:block";
  }

  return (
    <div className="relative pt-24 lg:pb-20 md:pt-32">
      {/* Page header */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="font-serif text-sm italic text-mute">— check availability</p>
        <h1 className="mt-3 max-w-3xl font-serif text-[36px] leading-[1.05] text-ink md:text-[64px]" style={{ letterSpacing: "-1.4px" }}>
          Pick your dates.
          <br />
          <span className="italic text-brand">We'll hold the unit</span> while you finish up.
        </h1>
        <p className="mt-4 hidden max-w-2xl text-base leading-[1.6] text-body md:block md:text-lg">
          Holds last 15 minutes. Paystack confirms instantly; bank transfers go to
          us for a quick manual check.
        </p>
      </div>

      {/* Mobile step indicator */}
      <div className="mx-auto mt-8 max-w-7xl px-4 md:px-6 lg:hidden">
        <MobileStepIndicator current={mobileStep} />
      </div>

      {/* Main grid */}
      <div className="mx-auto mt-6 grid max-w-7xl gap-8 px-4 md:px-6 lg:mt-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">

          {/* Back navigation (mobile steps 2 and 3 only) */}
          {mobileStep > 1 ? (
            <button
              type="button"
              onClick={() => setMobileStep((s) => (s - 1) as 1 | 2 | 3)}
              className="lg:hidden flex items-center gap-1 font-serif text-sm italic text-mute hover:text-ink transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : null}

          {/* ── Step 1: Unit picker ── */}
          <div className={stepVis(1)}>
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
                        active ? "bg-brand/90 text-canvas shadow-ambient" : "bg-surface-card text-ink hover:bg-surface-deep"
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
          </div>

          {/* ── Step 2: Availability calendar ── */}
          <div className={stepVis(2)}>
            <AvailabilityCalendar
              apartmentTypeId={apartmentTypeId}
              days={days}
              checkIn={checkIn}
              checkOut={checkOut}
              onMonthChange={setMonth}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* ── Step 3: Guest details + payment ── */}
          <div className={stepVis(3)}>
            <form ref={formRef} onSubmit={handleSubmit} className="rounded-lg bg-canvas p-6 shadow-ambient md:p-8">
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

              <div className="mt-8">
                <p className="font-serif text-sm italic text-mute">— how you'd like to pay</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                <div className={cn(
                  "mt-6 flex items-start gap-2 rounded-md px-4 py-3 text-sm",
                  formState.status === "success"
                    ? "bg-success-pale text-success"
                    : "bg-surface-card text-danger ring-1 ring-danger/20"
                )}>
                  {formState.status === "success"
                    ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  <span>{formState.message}</span>
                </div>
              ) : null}

              {/* Desktop-only submit — mobile uses the sticky bar */}
              <button
                disabled={isPending || submitting}
                className="mt-8 hidden h-12 items-center rounded-full bg-brand px-7 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed disabled:translate-y-0 disabled:bg-stone disabled:shadow-none lg:inline-flex"
              >
                {submitting
                  ? "Working on it…"
                  : paymentMethod === "paystack" ? "Continue to payment →" : "Reserve with bank transfer →"}
              </button>
            </form>
          </div>
        </div>

        {/* Summary aside — desktop only */}
        <aside className="hidden lg:block">
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
                  <span className="font-serif text-3xl text-ink">{formatCurrency(finalTotal)}</span>
                </div>
              </>
            ) : null}

            <div className="mt-6 rounded-md bg-surface-card p-4 text-xs leading-[1.6] text-mute">
              We hold the unit for 15 minutes once you submit. Paystack confirms
              automatically; bank transfer waits for a quick manual check.
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile sticky bottom action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 shadow-scrim backdrop-blur-sm lg:hidden">
        <div className="mx-auto max-w-lg px-4 py-3">
          {/* Running mini-summary */}
          <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
            <p className="truncate font-serif italic text-ink">
              {apartment.shortName} Maisonette
              {checkIn ? ` · ${formatDate(checkIn)}` : ""}
              {checkOut ? ` → ${formatDate(checkOut)}` : ""}
            </p>
            {quote ? (
              <p className="flex-shrink-0 font-bold text-ink">{formatCurrency(finalTotal)}</p>
            ) : (
              <p className="flex-shrink-0 text-xs text-mute">
                {mobileStep === 2 ? (checkIn ? "pick check-out →" : "tap a date to start") : ""}
              </p>
            )}
          </div>

          {/* Primary CTA */}
          {mobileStep < 3 ? (
            <button
              type="button"
              disabled={mobileStep === 2 && !canProceedFromStep2}
              onClick={() => setMobileStep((s) => (s + 1) as 2 | 3)}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-ambient transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone disabled:shadow-none"
            >
              {mobileStep === 1 ? "Continue to dates →" : "Continue with these dates →"}
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending || submitting}
              onClick={() => formRef.current?.requestSubmit()}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-ambient transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone disabled:shadow-none"
            >
              {submitting
                ? "Working on it…"
                : paymentMethod === "paystack" ? "Continue to payment →" : "Reserve with bank transfer →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileStepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1 as const, label: "Unit" },
    { n: 2 as const, label: "Dates" },
    { n: 3 as const, label: "Details" }
  ];

  return (
    <div className="flex items-start">
      {steps.map((step, i) => (
        <Fragment key={step.n}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
              current === step.n ? "bg-brand text-canvas shadow-ambient" :
              current > step.n ? "bg-ink text-canvas" :
              "bg-surface-card text-mute"
            )}>
              {current > step.n ? "✓" : step.n}
            </div>
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.12em]",
              current >= step.n ? "text-ink" : "text-mute"
            )}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 ? (
            <div className={cn(
              "mx-2 mt-4 h-px flex-1 transition-colors",
              current >= i + 2 ? "bg-brand" : "bg-hairline"
            )} />
          ) : null}
        </Fragment>
      ))}
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
