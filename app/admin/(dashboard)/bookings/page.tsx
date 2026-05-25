import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { StatusPill } from "@/components/admin/status-pill";
import { ActionForm, type ActionResult } from "@/components/admin/action-form";
import {
  getApartmentTypeById,
  getBookingsAsync,
  getUnits,
  updateBookingAsync
} from "@/lib/services/repository";
import { processPaystackRefundAsync, markRefundedAsync } from "@/lib/services/refunds";
import type { BookingStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const ACTIONABLE_STATUSES: { value: BookingStatus; label: string }[] = [
  { value: "confirmed", label: "Confirm" },
  { value: "cancelled", label: "Cancel" },
  { value: "refund_pending", label: "Mark refund pending" },
  { value: "refunded", label: "Mark refunded" },
  { value: "admin_blocked", label: "Block" }
];

async function ensureAdmin(): Promise<ActionResult | null> {
  const session = await auth();
  return session?.user ? null : { ok: false, error: "Your session expired — sign in again." };
}

async function updateBookingStatus(formData: FormData): Promise<ActionResult> {
  "use server";
  const denied = await ensureAdmin();
  if (denied) return denied;
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as BookingStatus;
  if (!id) return { ok: false, error: "Enter a booking ID." };
  try {
    const booking = await updateBookingAsync(id, { status });
    if (!booking) return { ok: false, error: `No booking found for "${id}".` };
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true, message: `Booking marked ${status.replaceAll("_", " ")}.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't update the booking." };
  }
}

async function processPaystackRefund(formData: FormData): Promise<ActionResult> {
  "use server";
  const denied = await ensureAdmin();
  if (denied) return denied;
  const id = String(formData.get("id"));
  if (!id) return { ok: false, error: "Missing booking ID." };
  try {
    await processPaystackRefundAsync(id);
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true, message: "Refund issued via Paystack." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Paystack refund failed." };
  }
}

async function markRefunded(formData: FormData): Promise<ActionResult> {
  "use server";
  const denied = await ensureAdmin();
  if (denied) return denied;
  const id = String(formData.get("id"));
  if (!id) return { ok: false, error: "Missing booking ID." };
  try {
    await markRefundedAsync(id);
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true, message: "Marked as refunded." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't update the booking." };
  }
}

export default async function Page() {
  const bookings = await getBookingsAsync();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-serif text-sm italic text-mute">— operations</p>
          <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
            Bookings
          </h2>
          <p className="mt-2 font-serif text-sm italic text-mute">
            {bookings.length} total · sort: newest first
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/bookings/new"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-ambient hover:bg-brand-pressed"
          >
            <Plus className="h-4 w-4" /> New booking
          </Link>

          <ActionForm
            action={updateBookingStatus}
            loadingText="Updating booking…"
            successText="Booking updated."
            className="flex flex-wrap items-center gap-2 rounded-full bg-canvas p-1.5 shadow-ambient"
          >
            <input
              name="id"
              placeholder="Booking ID"
              className="h-10 w-44 rounded-full bg-surface-card px-4 text-sm text-ink placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
            <select
              name="status"
              defaultValue="confirmed"
              className="h-10 rounded-full bg-surface-card px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              {ACTIONABLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-bold text-canvas hover:bg-ink-soft"
            >
              Update
            </button>
          </ActionForm>
        </div>
      </section>

      <section className="rounded-lg bg-canvas shadow-ambient">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.18em] text-mute">
              <tr className="border-b border-hairline">
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-3 py-4 font-semibold">Apartment</th>
                <th className="px-3 py-4 font-semibold">Unit</th>
                <th className="px-3 py-4 font-semibold">Guest</th>
                <th className="px-3 py-4 font-semibold">Dates</th>
                <th className="px-3 py-4 font-semibold">Payment</th>
                <th className="px-3 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const apartment = getApartmentTypeById(booking.apartmentTypeId);
                const unit = getUnits(booking.apartmentTypeId).find((item) => item.id === booking.unitId);
                return (
                  <tr key={booking.id} className="border-b border-hairline-soft align-top last:border-0">
                    <td className="px-6 py-4 font-mono text-xs text-ink">{booking.id}</td>
                    <td className="px-3 py-4 text-body">{apartment?.shortName}</td>
                    <td className="px-3 py-4 text-body">{unit?.name ?? "—"}</td>
                    <td className="px-3 py-4 text-body">
                      <p className="font-semibold text-ink">{booking.guest.fullName}</p>
                      <p className="text-xs text-mute">{booking.guest.email}</p>
                      <p className="text-xs text-mute">{booking.guest.phone}</p>
                    </td>
                    <td className="px-3 py-4 font-serif text-sm italic text-body">
                      {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                    </td>
                    <td className="px-3 py-4 text-body">
                      <p className="capitalize">{booking.paymentMethod?.replaceAll("_", " ") ?? "—"}</p>
                      {booking.paymentStatus ? (
                        <p className="text-xs italic text-mute">{booking.paymentStatus.replaceAll("_", " ")}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill status={booking.status} />
                      {booking.status === "refund_pending" ? (
                        <div className="mt-2 space-y-1.5">
                          {booking.refundAmount != null ? (
                            <p className="text-xs italic text-mute">
                              refund {formatCurrency(booking.refundAmount)}
                            </p>
                          ) : null}
                          {booking.paymentMethod === "paystack" ? (
                            <ActionForm
                              action={processPaystackRefund}
                              loadingText="Issuing Paystack refund…"
                              successText="Refund issued."
                              confirm={`Refund ${booking.refundAmount != null ? formatCurrency(booking.refundAmount) : "this booking"} via Paystack?`}
                            >
                              <input type="hidden" name="id" value={booking.id} />
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center rounded-full bg-brand px-3 text-xs font-bold text-white hover:bg-brand-pressed"
                              >
                                Refund via Paystack
                              </button>
                            </ActionForm>
                          ) : (
                            <ActionForm
                              action={markRefunded}
                              loadingText="Updating…"
                              successText="Marked refunded."
                              confirm="Mark this booking as refunded?"
                            >
                              <input type="hidden" name="id" value={booking.id} />
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center rounded-full bg-ink px-3 text-xs font-bold text-canvas hover:bg-ink-soft"
                              >
                                Mark refunded
                              </button>
                            </ActionForm>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-ink">
                      {formatCurrency(booking.total)}
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center font-serif text-sm italic text-mute">
                    No bookings yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
