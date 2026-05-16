import { randomUUID } from "node:crypto";
import {
  createDraftHold,
  getApartmentTypeById,
  getBookingById,
  getBookingByIdAsync,
  hasDatabase,
  saveBooking,
  saveBookingAsync,
  updateBooking,
  updateBookingAsync
} from "@/lib/services/repository";
import {
  calculateQuote,
  calculateQuoteAsync,
  findAvailableUnit,
  isRangeAvailable
} from "@/lib/services/availability";
import { createBookingHoldTransactional, HoldUnavailableError } from "@/lib/services/holds";
import type { Booking, CreateBookingInput, PaymentMethod, PaymentStatus, BookingStatus } from "@/lib/types";

function newPaymentReference() {
  return `CAMOB_${randomUUID()}`;
}

function statusesForPaymentMethod(method: PaymentMethod): { status: BookingStatus; paymentStatus: PaymentStatus } {
  if (method === "paystack") {
    return { status: "pending_payment", paymentStatus: "initialized" };
  }
  // Bank transfer never auto-confirms. Admin marks it paid after seeing the
  // money land — until then the dates are held but not earned.
  return { status: "pending_payment", paymentStatus: "pending_review" };
}

function applyFinalizePatch(booking: Booking, input: CreateBookingInput) {
  const { status, paymentStatus } = statusesForPaymentMethod(input.paymentMethod);

  booking.apartmentTypeId = input.apartmentTypeId;
  booking.checkIn = input.checkIn;
  booking.checkOut = input.checkOut;
  booking.paymentMethod = input.paymentMethod;
  booking.paymentStatus = paymentStatus;
  booking.status = status;
  booking.guest = input.guest;
  // Idempotency: only mint a reference once per booking.
  booking.paymentReference = booking.paymentReference ?? newPaymentReference();
}

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

export async function createBookingHoldAsync(input: {
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

  const quote = await calculateQuoteAsync(input.apartmentTypeId, input.checkIn, input.checkOut);

  // DB path: create the hold inside a serializable transaction so two
  // racing requests can't both claim the same unit/window.
  if (hasDatabase()) {
    try {
      const created = await createBookingHoldTransactional(input);
      const finalized = await updateBookingAsync(created.id, {
        subtotal: quote.subtotal,
        serviceCharge: quote.serviceCharge,
        total: quote.total
      });
      return { hold: finalized ?? created, quote };
    } catch (error) {
      if (error instanceof HoldUnavailableError) {
        throw new Error(error.message);
      }
      throw error;
    }
  }

  // Memory-only dev fallback.
  if (!isRangeAvailable(input.apartmentTypeId, input.checkIn, input.checkOut)) {
    throw new Error("Selected dates are no longer available");
  }
  const unit = findAvailableUnit(input.apartmentTypeId, input.checkIn, input.checkOut);
  if (!unit) {
    throw new Error("No unit available for the selected dates");
  }
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

  applyFinalizePatch(booking, input);
  booking.subtotal = quote.subtotal;
  booking.serviceCharge = quote.serviceCharge;
  booking.total = quote.total;

  saveBooking(booking);

  return {
    booking,
    quote
  };
}

export async function finalizeBookingAsync(input: CreateBookingInput & { holdId?: string }) {
  const quote = await calculateQuoteAsync(input.apartmentTypeId, input.checkIn, input.checkOut);

  let booking = input.holdId ? await getBookingByIdAsync(input.holdId) : null;
  if (!booking) {
    const holdResult = await createBookingHoldAsync({
      apartmentTypeId: input.apartmentTypeId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guest.guests
    });
    booking = holdResult.hold;
  }

  applyFinalizePatch(booking, input);
  booking.subtotal = quote.subtotal;
  booking.serviceCharge = quote.serviceCharge;
  booking.total = quote.total;

  const savedBooking = await saveBookingAsync(booking);

  return {
    booking: savedBooking,
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

export async function confirmBookingPaymentAsync(bookingId: string, reference: string) {
  const booking = await updateBookingAsync(bookingId, {
    status: "confirmed",
    paymentStatus: "paid",
    paymentReference: reference
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
}
