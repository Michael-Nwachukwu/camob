import Link from "next/link";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { StatusPill } from "@/components/admin/status-pill";
import { getAdminSummaryAsync, getBookingsAsync, getApartmentTypeById } from "@/lib/services/repository";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function Page() {
  const [summary, bookings] = await Promise.all([getAdminSummaryAsync(), getBookingsAsync()]);
  const recentBookings = bookings.slice(0, 6);

  return (
    <div className="space-y-8">
      <section>
        <p className="font-serif text-sm italic text-mute">— at a glance</p>
        <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
          Today, in numbers
        </h2>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Inventory" value={summary.inventory} hint="units on the property" />
        <AdminStatCard label="Confirmed" value={summary.confirmedBookings} hint="paid + scheduled" />
        <AdminStatCard label="Pending" value={summary.pendingBookings} hint="holds + bank transfer" />
        <AdminStatCard label="Gross revenue" value={formatCurrency(summary.grossRevenue)} hint="confirmed only" />
      </section>

      <section className="rounded-lg bg-canvas p-6 shadow-ambient md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-serif text-sm italic text-mute">— most recent</p>
            <h2 className="mt-1 font-serif text-2xl text-ink md:text-3xl" style={{ letterSpacing: "-0.4px" }}>
              Latest bookings
            </h2>
          </div>
          <Link
            href="/admin/bookings"
            className="inline-flex h-10 items-center rounded-full bg-surface-card px-4 text-sm font-semibold text-ink hover:bg-surface-deep"
          >
            All bookings →
          </Link>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.18em] text-mute">
              <tr className="border-b border-hairline">
                <th className="pb-3 pr-4 font-semibold">Reference</th>
                <th className="pb-3 pr-4 font-semibold">Guest</th>
                <th className="pb-3 pr-4 font-semibold">Apartment</th>
                <th className="pb-3 pr-4 font-semibold">Dates</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => {
                const apartment = getApartmentTypeById(booking.apartmentTypeId);
                return (
                  <tr key={booking.id} className="border-b border-hairline-soft last:border-0">
                    <td className="py-4 pr-4 font-mono text-xs text-ink">{booking.id}</td>
                    <td className="py-4 pr-4 text-body">
                      <p className="font-semibold text-ink">{booking.guest.fullName}</p>
                      <p className="text-xs text-mute">{booking.guest.email}</p>
                    </td>
                    <td className="py-4 pr-4 text-body">{apartment?.shortName ?? booking.apartmentTypeId}</td>
                    <td className="py-4 pr-4 font-serif text-sm italic text-body">
                      {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                    </td>
                    <td className="py-4 pr-4">
                      <StatusPill status={booking.status} />
                    </td>
                    <td className="py-4 font-semibold text-ink">{formatCurrency(booking.total)}</td>
                  </tr>
                );
              })}
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-serif text-sm italic text-mute">
                    Nothing booked yet.
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

