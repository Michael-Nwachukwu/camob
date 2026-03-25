import { getApartmentTypeById, getBookings, getUnits, updateBooking } from "@/lib/services/repository";
import { formatCurrency } from "@/lib/utils";

export default function Page() {
  const bookings = getBookings();

  return (
    <div className="rounded-[2rem] bg-white p-8 shadow-ambient">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl text-primary">Bookings</h2>
        <form
          action={async (formData) => {
            "use server";
            const id = String(formData.get("id"));
            const status = String(formData.get("status"));
            updateBooking(id, { status: status as never });
          }}
          className="flex items-center gap-3"
        >
          <input name="id" placeholder="Booking ID" className="rounded-full border border-outline px-4 py-2 text-sm" />
          <select name="status" className="rounded-full border border-outline px-4 py-2 text-sm">
            <option value="confirmed">Confirm</option>
            <option value="cancelled">Cancel</option>
            <option value="refund_pending">Refund pending</option>
          </select>
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">Update</button>
        </form>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.3em] text-secondary">
            <tr>
              <th className="pb-4">Booking</th>
              <th className="pb-4">Apartment</th>
              <th className="pb-4">Unit</th>
              <th className="pb-4">Guest</th>
              <th className="pb-4">Payment</th>
              <th className="pb-4">Status</th>
              <th className="pb-4">Total</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const apartment = getApartmentTypeById(booking.apartmentTypeId);
              const unit = getUnits(booking.apartmentTypeId).find((item) => item.id === booking.unitId);

              return (
                <tr key={booking.id} className="border-t border-outline/60 align-top">
                  <td className="py-4 font-semibold text-primary">{booking.id}</td>
                  <td className="py-4 text-muted">{apartment?.name}</td>
                  <td className="py-4 text-muted">{unit?.name}</td>
                  <td className="py-4 text-muted">
                    <p>{booking.guest.fullName}</p>
                    <p>{booking.guest.email}</p>
                  </td>
                  <td className="py-4 capitalize text-muted">{booking.paymentMethod?.replace("_", " ") ?? "n/a"}</td>
                  <td className="py-4 capitalize text-primary">{booking.status.replaceAll("_", " ")}</td>
                  <td className="py-4 text-primary">{formatCurrency(booking.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
