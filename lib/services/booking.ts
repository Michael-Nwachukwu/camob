import { getApartmentTypeById, createDraftHold, getBookingById, saveBooking, updateBooking } from "@/lib/services/repository";
import { calculateQuote, findAvailableUnit, isRangeAvailable } from "@/lib/services/availability";
import type { CreateBookingInput } from "@/lib/types";

export function createBookingHold(input: {
  apartmentTypeId: CreateBookingInput["apartmentTypeId"];
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const apartment = getApartmentTypeById(input.apartmentTypeId);
  if (!apartment) {
    throw new Error("Apartment type not found");
  }

  if (input.guests > apartment.maxGuests) {
    throw new Error("Guest count exceeds unit capacity");
  }

  if (!isRangeAvailable(input.apartmentTypeId, input.checkIn, input.checkOut)) {
    throw new Error("Selected dates are no longer available");
  }

  const unit = findAvailableUnit(input.apartmentTypeId, input.checkIn, input.checkOut);
  if (!unit) {
    throw new Error("No unit available for the selected dates");
  }

  const quote = calculateQuote(input.apartmentTypeId, input.checkIn, input.checkOut);
  const hold = createDraftHold({
    apartmentTypeId: input.apartmentTypeId,
    unitId: unit.id,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests
  });

  hold.subtotal = quote.subtotal;
  hold.serviceCharge = quote.serviceCharge;
  hold.total = quote.total;
  saveBooking(hold);
  return { hold, quote };
}

export function finalizeBooking(input: CreateBookingInput & { holdId?: string }) {
  const quote = calculateQuote(input.apartmentTypeId, input.checkIn, input.checkOut);

  let booking = input.holdId ? getBookingById(input.holdId) : null;
  if (!booking) {
    const holdResult = createBookingHold({
      apartmentTypeId: input.apartmentTypeId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guest.guests
    });
    booking = holdResult.hold;
  }

  booking.apartmentTypeId = input.apartmentTypeId;
  booking.checkIn = input.checkIn;
  booking.checkOut = input.checkOut;
  booking.paymentMethod = input.paymentMethod;
  booking.paymentStatus = input.paymentMethod === "paystack" ? "initialized" : "pending_review";
  booking.status = input.paymentMethod === "paystack" ? "pending_payment" : "confirmed";
  booking.guest = input.guest;
  booking.subtotal = quote.subtotal;
  booking.serviceCharge = quote.serviceCharge;
  booking.total = quote.total;
  booking.paymentReference = `CAMOB_${Date.now()}`;

  saveBooking(booking);

  return {
    booking,
    quote
  };
}

export function confirmBookingPayment(bookingId: string, reference: string) {
  const booking = updateBooking(bookingId, {
    status: "confirmed",
    paymentStatus: "paid",
    paymentReference: reference
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
}
