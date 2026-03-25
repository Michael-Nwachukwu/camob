import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { getAdminSummary, getBookings } from "@/lib/services/repository";
import { formatCurrency } from "@/lib/utils";

export default function Page() {
  const summary = getAdminSummary();
  const recentBookings = getBookings().slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Inventory" value={summary.inventory} />
        <AdminStatCard label="Confirmed Bookings" value={summary.confirmedBookings} />
        <AdminStatCard label="Pending Holds" value={summary.pendingBookings} />
        <AdminStatCard label="Gross Revenue" value={formatCurrency(summary.grossRevenue)} />
      </div>

      <section className="rounded-[2rem] bg-white p-8 shadow-ambient">
        <h2 className="font-serif text-3xl text-primary">Recent booking activity</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.3em] text-secondary">
              <tr>
                <th className="pb-4">Reference</th>
                <th className="pb-4">Guest</th>
                <th className="pb-4">Dates</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-outline/60">
                  <td className="py-4 font-semibold text-primary">{booking.id}</td>
                  <td className="py-4 text-muted">{booking.guest.fullName}</td>
                  <td className="py-4 text-muted">
                    {booking.checkIn} - {booking.checkOut}
                  </td>
                  <td className="py-4 capitalize text-primary">{booking.status.replaceAll("_", " ")}</td>
                  <td className="py-4 text-primary">{formatCurrency(booking.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
