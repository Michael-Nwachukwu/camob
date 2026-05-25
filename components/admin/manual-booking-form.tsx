"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { apartmentTypes } from "@/lib/data/camob";
import { manualBookingSchema } from "@/lib/validators/booking";

type ManualBookingInput = z.infer<typeof manualBookingSchema>;
type ActionResult = { ok: true; bookingId: string } | { ok: false; error: string };

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function ManualBookingForm({
  createManualBooking
}: {
  createManualBooking: (input: ManualBookingInput) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const candidate = {
      apartmentTypeId: fd.get("apartmentTypeId"),
      checkIn: fd.get("checkIn"),
      checkOut: fd.get("checkOut"),
      paymentMethod: fd.get("paymentMethod"),
      status: fd.get("status"),
      paymentStatus: fd.get("paymentStatus"),
      guest: {
        fullName: fd.get("fullName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        guests: fd.get("guests"),
        specialRequests: fd.get("specialRequests") || undefined
      }
    };

    const parsed = manualBookingSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(fieldErrorsFrom(parsed.error));
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});

    const toastId = toast.loading("Creating booking…");
    startTransition(async () => {
      const result = await createManualBooking(parsed.data);
      if (result.ok) {
        toast.success("Booking created.", { id: toastId });
        router.push("/admin/bookings");
      } else {
        toast.error(result.error, { id: toastId });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-canvas p-6 shadow-ambient md:p-8" noValidate>
      {/* Stay */}
      <fieldset className="space-y-4">
        <legend className="font-serif text-base italic text-ink">— the stay</legend>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Apartment" error={errors["apartmentTypeId"]}>
            <select name="apartmentTypeId" defaultValue="one-bedroom" className={inputCls}>
              {apartmentTypes.map((apartment) => (
                <option key={apartment.id} value={apartment.id}>{apartment.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Check-in" error={errors["checkIn"]}>
            <input name="checkIn" type="date" className={inputCls} />
          </Field>
          <Field label="Check-out" error={errors["checkOut"]}>
            <input name="checkOut" type="date" className={inputCls} />
          </Field>
        </div>
      </fieldset>

      {/* Guest */}
      <fieldset className="space-y-4 border-t border-hairline pt-6">
        <legend className="font-serif text-base italic text-ink">— the guest</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" error={errors["guest.fullName"]}>
            <input name="fullName" placeholder="Adaobi Okeke" className={inputCls} />
          </Field>
          <Field label="Email" error={errors["guest.email"]}>
            <input name="email" type="email" placeholder="ada@example.com" className={inputCls} />
          </Field>
          <Field label="Phone" error={errors["guest.phone"]}>
            <input name="phone" placeholder="+234…" className={inputCls} />
          </Field>
          <Field label="Guests" error={errors["guest.guests"]}>
            <input name="guests" type="number" min={1} max={4} defaultValue={2} className={inputCls} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes (optional)" error={errors["guest.specialRequests"]}>
              <textarea
                name="specialRequests"
                rows={3}
                placeholder="Late check-in, transport from airport, dietary notes…"
                className={`${inputCls} h-auto py-3`}
              />
            </Field>
          </div>
        </div>
      </fieldset>

      {/* Payment */}
      <fieldset className="space-y-4 border-t border-hairline pt-6">
        <legend className="font-serif text-base italic text-ink">— payment record</legend>
        <p className="font-serif text-sm italic text-mute">
          How it was actually paid. The total is computed from the apartment's current rate.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Method" error={errors["paymentMethod"]}>
            <select name="paymentMethod" defaultValue="bank_transfer" className={inputCls}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="paystack">Paystack (external)</option>
            </select>
          </Field>
          <Field label="Booking status" error={errors["status"]}>
            <select name="status" defaultValue="confirmed" className={inputCls}>
              <option value="confirmed">Confirmed (paid)</option>
              <option value="pending_payment">Pending payment</option>
              <option value="admin_blocked">Admin block / VIP hold</option>
            </select>
          </Field>
          <Field label="Payment status" error={errors["paymentStatus"]}>
            <select name="paymentStatus" defaultValue="paid" className={inputCls}>
              <option value="paid">Paid</option>
              <option value="pending_review">Pending review</option>
              <option value="initialized">Initialized</option>
            </select>
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed disabled:translate-y-0 disabled:bg-stone disabled:shadow-none"
        >
          {pending ? "Creating…" : "Create booking"}
        </button>
        <Link
          href="/admin/bookings"
          className="inline-flex h-12 items-center rounded-full bg-surface-card px-6 text-sm font-bold text-ink hover:bg-surface-deep"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring";

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{label}</label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
