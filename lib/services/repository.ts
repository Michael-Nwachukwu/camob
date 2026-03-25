import { addMinutes } from "date-fns";
import {
  apartmentTypes,
  attractions,
  blockedDateRanges,
  faqItems,
  ratePlans,
  seededBookings,
  siteCopy,
  units
} from "@/lib/data/camob";
import type {
  ApartmentTypeId,
  ApartmentTypeSummary,
  BlockedDateRange,
  Booking,
  BookingStatus,
  RatePlan
} from "@/lib/types";

const bookingStore: Booking[] = [...seededBookings];
const blackoutStore: BlockedDateRange[] = [...blockedDateRanges];
const rateStore: RatePlan[] = [...ratePlans];

export function getSiteCopy() {
  return siteCopy;
}

export function getFaqItems() {
  return faqItems;
}

export function getAttractions() {
  return attractions;
}

export function getApartmentTypes() {
  return apartmentTypes;
}

export function getApartmentTypeById(id: ApartmentTypeId) {
  return apartmentTypes.find((apartment) => apartment.id === id) ?? null;
}

export function getApartmentTypeBySlug(slug: string) {
  return apartmentTypes.find((apartment) => apartment.slug === slug) ?? null;
}

export function getUnits(apartmentTypeId?: ApartmentTypeId) {
  if (!apartmentTypeId) {
    return units;
  }

  return units.filter((unit) => unit.apartmentTypeId === apartmentTypeId);
}

export function getRate(apartmentTypeId: ApartmentTypeId) {
  return rateStore.find((rate) => rate.apartmentTypeId === apartmentTypeId)!;
}

export function updateRate(apartmentTypeId: ApartmentTypeId, nightlyRate: number, serviceCharge: number) {
  const existing = rateStore.find((rate) => rate.apartmentTypeId === apartmentTypeId);
  if (existing) {
    existing.nightlyRate = nightlyRate;
    existing.serviceCharge = serviceCharge;
    return existing;
  }

  const rate = {
    apartmentTypeId,
    nightlyRate,
    serviceCharge,
    currency: "NGN" as const
  };
  rateStore.push(rate);
  return rate;
}

export function getBookings() {
  return bookingStore;
}

export function getActiveBookings() {
  const now = new Date();
  return bookingStore.filter((booking) => {
    if (booking.status === "cancelled" || booking.status === "expired" || booking.status === "refunded") {
      return false;
    }

    if (booking.status === "draft_hold" && booking.expiresAt && new Date(booking.expiresAt) < now) {
      booking.status = "expired";
      return false;
    }

    return true;
  });
}

export function getBookingById(id: string) {
  return bookingStore.find((booking) => booking.id === id) ?? null;
}

export function saveBooking(booking: Booking) {
  const existingIndex = bookingStore.findIndex((item) => item.id === booking.id);
  if (existingIndex >= 0) {
    bookingStore[existingIndex] = booking;
  } else {
    bookingStore.unshift(booking);
  }
  return booking;
}

export function updateBooking(id: string, patch: Partial<Booking>) {
  const booking = getBookingById(id);
  if (!booking) {
    return null;
  }

  Object.assign(booking, patch);
  return booking;
}

export function addBlackout(blockout: Omit<BlockedDateRange, "id">) {
  const record: BlockedDateRange = {
    id: `block-${Date.now()}`,
    ...blockout
  };
  blackoutStore.unshift(record);
  return record;
}

export function getBlackouts() {
  return blackoutStore;
}

export function createDraftHold(params: {
  apartmentTypeId: ApartmentTypeId;
  unitId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const booking: Booking = {
    id: `hold-${Date.now()}`,
    apartmentTypeId: params.apartmentTypeId,
    unitId: params.unitId,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    status: "draft_hold",
    guest: {
      fullName: "Guest hold",
      email: "hold@camobresidence.local",
      phone: "",
      guests: params.guests
    },
    subtotal: 0,
    serviceCharge: 0,
    total: 0,
    createdAt: new Date().toISOString(),
    expiresAt: addMinutes(new Date(), 15).toISOString()
  };

  bookingStore.unshift(booking);
  return booking;
}

export function getAdminSummary() {
  const activeBookings = getActiveBookings();
  const confirmed = activeBookings.filter((booking) => booking.status === "confirmed");
  const pending = activeBookings.filter(
    (booking) => booking.status === "draft_hold" || booking.status === "pending_payment"
  );
  const revenue = confirmed.reduce((sum, booking) => sum + booking.total, 0);

  return {
    inventory: apartmentTypes.reduce((sum, apartment) => sum + apartment.units, 0),
    confirmedBookings: confirmed.length,
    pendingBookings: pending.length,
    grossRevenue: revenue
  };
}

export function getStatusTone(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending_payment":
    case "draft_hold":
      return "warning";
    case "cancelled":
    case "expired":
    case "admin_blocked":
    case "refund_pending":
    case "refunded":
      return "danger";
    default:
      return "muted";
  }
}
