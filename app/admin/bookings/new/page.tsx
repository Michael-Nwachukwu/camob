import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { apartmentTypes } from "@/lib/data/camob";
import { createManualBookingAsync } from "@/lib/services/booking";
import { manualBookingSchema } from "@/lib/validators/booking";

async function createManualBooking(formData: FormData) {
  "use server";

  // Defense in depth — middleware already gates /admin, but a server action
  // is a POST endpoint, so re-check the session before mutating.
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const raw = {
    apartmentTypeId: formData.get("apartmentTypeId"),
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
    paymentMethod: formData.get("paymentMethod"),
    status: formData.get("status"),
    paymentStatus: formData.get("paymentStatus"),
    guest: {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      guests: formData.get("guests"),
      specialRequests: formData.get("specialRequests") || undefined
    }
  };

  const parsed = manualBookingSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid booking details — check the form fields.");
  }

  await createManualBookingAsync(parsed.data);
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  redirect("/admin/bookings");
}

export default function Page() {
  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1 font-serif text-sm italic text-mute hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      <section>
        <p className="font-serif text-sm italic text-mute">— off-platform reservation</p>
        <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
          Manual booking
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic text-mute">
          For walk-ins or WhatsApp guests who paid outside the website. Goes through the same unit-allocation
          transaction as a public booking — the dates must be free.
        </p>
      </section>

      <form action={createManualBooking} className="space-y-6 rounded-lg bg-canvas p-6 shadow-ambient md:p-8">
        {/* Stay */}
        <fieldset className="space-y-4">
          <legend className="font-serif text-base italic text-ink">— the stay</legend>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Apartment">
              <select
                name="apartmentTypeId"
                defaultValue="one-bedroom"
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                {apartmentTypes.map((apartment) => (
                  <option key={apartment.id} value={apartment.id}>
                    {apartment.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Check-in">
              <input
                name="checkIn"
                type="date"
                required
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </Field>
            <Field label="Check-out">
              <input
                name="checkOut"
                type="date"
                required
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </Field>
          </div>
        </fieldset>

        {/* Guest */}
        <fieldset className="space-y-4 border-t border-hairline pt-6">
          <legend className="font-serif text-base italic text-ink">— the guest</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                name="fullName"
                required
                placeholder="Adaobi Okeke"
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                placeholder="ada@example.com"
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </Field>
            <Field label="Phone">
              <input
                name="phone"
                required
                placeholder="+234…"
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </Field>
            <Field label="Guests">
              <input
                name="guests"
                type="number"
                min={1}
                max={4}
                defaultValue={2}
                required
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes (optional)">
                <textarea
                  name="specialRequests"
                  rows={3}
                  placeholder="Late check-in, transport from airport, dietary notes…"
                  className="w-full rounded-md bg-canvas px-3 py-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
                />
              </Field>
            </div>
          </div>
        </fieldset>

        {/* Payment */}
        <fieldset className="space-y-4 border-t border-hairline pt-6">
          <legend className="font-serif text-base italic text-ink">— payment record</legend>
          <p className="font-serif text-sm italic text-mute">
            Pick how it was actually paid. The booking total is computed from the apartment's current rate.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Method">
              <select
                name="paymentMethod"
                defaultValue="bank_transfer"
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="paystack">Paystack (external)</option>
              </select>
            </Field>
            <Field label="Booking status">
              <select
                name="status"
                defaultValue="confirmed"
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <option value="confirmed">Confirmed (paid)</option>
                <option value="pending_payment">Pending payment</option>
                <option value="admin_blocked">Admin block / VIP hold</option>
              </select>
            </Field>
            <Field label="Payment status">
              <select
                name="paymentStatus"
                defaultValue="paid"
                className="h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
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
            className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed"
          >
            Create booking
          </button>
          <Link
            href="/admin/bookings"
            className="inline-flex h-12 items-center rounded-full bg-surface-card px-6 text-sm font-bold text-ink hover:bg-surface-deep"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
