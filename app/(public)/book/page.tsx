import { BookingFlow } from "@/components/booking/booking-flow";
import type { ApartmentTypeId } from "@/lib/types";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ apartmentTypeId?: ApartmentTypeId; checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const params = await searchParams;
  const apartmentTypeId =
    params.apartmentTypeId === "one-bedroom" || params.apartmentTypeId === "two-bedroom"
      ? params.apartmentTypeId
      : undefined;
  const guests = params.guests ? Number(params.guests) : undefined;

  return (
    <BookingFlow
      initialApartmentTypeId={apartmentTypeId}
      initialCheckIn={params.checkIn}
      initialCheckOut={params.checkOut}
      initialGuests={Number.isFinite(guests) ? guests : undefined}
    />
  );
}
