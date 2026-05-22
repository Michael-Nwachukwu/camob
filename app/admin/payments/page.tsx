import { getPaymentsAsync, getApartmentTypeById } from "@/lib/services/repository";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types";

export default async function Page() {
  const payments = await getPaymentsAsync(200);

  return (
    <div className="space-y-6">
      <section>
        <p className="font-serif text-sm italic text-mute">— money in</p>
        <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
          Payments
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic text-mute">
          Every payment record on the database, newest first. One row per attempt — a bank transfer that's
          still awaiting review shows up here too.
        </p>
      </section>

      <section className="rounded-lg bg-canvas shadow-ambient">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.18em] text-mute">
              <tr className="border-b border-hairline">
                <th className="px-6 py-4 font-semibold">When</th>
                <th className="px-3 py-4 font-semibold">Reference</th>
                <th className="px-3 py-4 font-semibold">Guest</th>
                <th className="px-3 py-4 font-semibold">Apartment</th>
                <th className="px-3 py-4 font-semibold">Method</th>
                <th className="px-3 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const apartment = getApartmentTypeById(payment.booking.apartmentTypeId);
                return (
                  <tr key={payment.id} className="border-b border-hairline-soft align-top last:border-0">
                    <td className="px-6 py-4 font-serif text-sm italic text-body">
                      {formatDate(payment.createdAt.slice(0, 10), "MMM d")}
                      <span className="text-mute"> · {payment.createdAt.slice(11, 16)}</span>
                    </td>
                    <td className="px-3 py-4 font-mono text-xs text-ink">{payment.reference}</td>
                    <td className="px-3 py-4 text-body">
                      <p className="font-semibold text-ink">{payment.booking.guestFullName}</p>
                      <p className="text-xs text-mute">{payment.booking.guestEmail}</p>
                    </td>
                    <td className="px-3 py-4 text-body">{apartment?.shortName ?? "—"}</td>
                    <td className="px-3 py-4 capitalize text-body">{payment.method.replaceAll("_", " ")}</td>
                    <td className="px-3 py-4">
                      <PaymentStatusPill status={payment.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-ink">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center font-serif text-sm italic text-mute">
                    No payments yet. Bookings paid via Paystack or marked as paid manually will show up here.
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

function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  const tone =
    status === "paid"
      ? "bg-success-pale text-success"
      : status === "failed"
      ? "bg-surface-card text-danger ring-1 ring-danger/20"
      : "bg-surface-card text-ink ring-1 ring-hairline";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
