import { addMinutes } from "date-fns";
import type {
  BlockedDateRange as PrismaBlockedDateRange,
  Booking as PrismaBookingModel,
  BookingStatus as PrismaBookingStatus,
  Payment as PrismaPaymentModel,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  RatePlan as PrismaRatePlan,
  Unit as PrismaUnit
} from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
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
  BlockedDateRange,
  Booking,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  RatePlan,
  Unit
} from "@/lib/types";

const bookingStore: Booking[] = [...seededBookings];
const blackoutStore: BlockedDateRange[] = [...blockedDateRanges];
const rateStore: RatePlan[] = [...ratePlans];

const CANCELLING_STATUSES: BookingStatus[] = ["cancelled", "expired", "refunded"];

type PrismaBookingWithRelations = PrismaBookingModel & {
  unit: PrismaUnit;
  payments: PrismaPaymentModel[];
};

function hasDatabase() {
  return Boolean(env.databaseUrl);
}

function toPrismaStatus(status: BookingStatus): PrismaBookingStatus {
  return status.toUpperCase() as PrismaBookingStatus;
}

function toPrismaPaymentMethod(method: PaymentMethod): PrismaPaymentMethod {
  return method.toUpperCase() as PrismaPaymentMethod;
}

function toPrismaPaymentStatus(status: PaymentStatus): PrismaPaymentStatus {
  return status.toUpperCase() as PrismaPaymentStatus;
}

function fromPrismaPaymentMethod(method?: PrismaPaymentMethod | null): PaymentMethod | undefined {
  return method ? (method.toLowerCase() as PaymentMethod) : undefined;
}

function fromPrismaPaymentStatus(status?: PrismaPaymentStatus | null): PaymentStatus | undefined {
  return status ? (status.toLowerCase() as PaymentStatus) : undefined;
}

function mapPrismaBooking(record: PrismaBookingWithRelations): Booking {
  const latestPayment = record.payments[0];

  return {
    id: record.id,
    unitId: record.unitId,
    apartmentTypeId: record.apartmentTypeId as ApartmentTypeId,
    checkIn: record.checkIn.toISOString().slice(0, 10),
    checkOut: record.checkOut.toISOString().slice(0, 10),
    status: record.status.toLowerCase() as BookingStatus,
    guest: {
      fullName: record.guestFullName,
      email: record.guestEmail,
      phone: record.guestPhone,
      guests: record.guestCount,
      specialRequests: record.specialRequests ?? undefined
    },
    subtotal: record.subtotal,
    serviceCharge: record.serviceCharge,
    total: record.total,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt?.toISOString(),
    paymentMethod: fromPrismaPaymentMethod(latestPayment?.method),
    paymentStatus: fromPrismaPaymentStatus(latestPayment?.status),
    paymentReference: latestPayment?.reference
  };
}

function mapPrismaRate(record: PrismaRatePlan): RatePlan {
  return {
    apartmentTypeId: record.apartmentTypeId as ApartmentTypeId,
    nightlyRate: record.nightlyRate,
    serviceCharge: record.serviceCharge,
    currency: "NGN"
  };
}

function mapPrismaBlackout(record: PrismaBlockedDateRange): BlockedDateRange {
  return {
    id: record.id,
    apartmentTypeId: record.apartmentTypeId as ApartmentTypeId,
    startDate: record.startDate.toISOString().slice(0, 10),
    endDate: record.endDate.toISOString().slice(0, 10),
    reason: record.reason
  };
}

function getMemoryRate(apartmentTypeId: ApartmentTypeId) {
  return rateStore.find((rate) => rate.apartmentTypeId === apartmentTypeId)!;
}

function getMemoryBookings() {
  return bookingStore;
}

function expireMemoryHolds() {
  const now = new Date();

  bookingStore.forEach((booking) => {
    if (booking.status === "draft_hold" && booking.expiresAt && new Date(booking.expiresAt) < now) {
      booking.status = "expired";
    }
  });
}

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
  return getMemoryRate(apartmentTypeId);
}

export async function getRateAsync(apartmentTypeId: ApartmentTypeId) {
  if (!hasDatabase()) {
    return getMemoryRate(apartmentTypeId);
  }

  try {
    const record = await prisma.ratePlan.findFirst({
      where: { apartmentTypeId },
      orderBy: [{ startsAt: "desc" }, { id: "desc" }]
    });

    return record ? mapPrismaRate(record) : getMemoryRate(apartmentTypeId);
  } catch {
    return getMemoryRate(apartmentTypeId);
  }
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

export async function updateRateAsync(apartmentTypeId: ApartmentTypeId, nightlyRate: number, serviceCharge: number) {
  const memoryRate = updateRate(apartmentTypeId, nightlyRate, serviceCharge);

  if (!hasDatabase()) {
    return memoryRate;
  }

  try {
    const existing = await prisma.ratePlan.findFirst({
      where: { apartmentTypeId, startsAt: null, endsAt: null },
      orderBy: { id: "desc" }
    });

    const record = existing
      ? await prisma.ratePlan.update({
          where: { id: existing.id },
          data: { nightlyRate, serviceCharge }
        })
      : await prisma.ratePlan.create({
          data: {
            apartmentTypeId,
            nightlyRate,
            serviceCharge,
            currency: "NGN"
          }
        });

    return mapPrismaRate(record);
  } catch {
    return memoryRate;
  }
}

export function getBookings() {
  return getMemoryBookings();
}

export async function getBookingsAsync() {
  if (!hasDatabase()) {
    expireMemoryHolds();
    return getMemoryBookings();
  }

  try {
    await prisma.booking.updateMany({
      where: {
        status: "DRAFT_HOLD",
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: "EXPIRED"
      }
    });

    const records = await prisma.booking.findMany({
      include: {
        unit: true,
        payments: {
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return records.map(mapPrismaBooking);
  } catch {
    expireMemoryHolds();
    return getMemoryBookings();
  }
}

export function getActiveBookings() {
  expireMemoryHolds();
  return bookingStore.filter((booking) => !CANCELLING_STATUSES.includes(booking.status));
}

export async function getActiveBookingsAsync() {
  const bookings = await getBookingsAsync();
  return bookings.filter((booking) => !CANCELLING_STATUSES.includes(booking.status));
}

export function getBookingById(id: string) {
  return bookingStore.find((booking) => booking.id === id) ?? null;
}

export async function getBookingByIdAsync(id: string) {
  if (!hasDatabase()) {
    return getBookingById(id);
  }

  try {
    const record = await prisma.booking.findUnique({
      where: { id },
      include: {
        unit: true,
        payments: {
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    return record ? mapPrismaBooking(record) : null;
  } catch {
    return getBookingById(id);
  }
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

export async function saveBookingAsync(booking: Booking) {
  const memoryBooking = saveBooking(booking);

  if (!hasDatabase()) {
    return memoryBooking;
  }

  try {
    const record = await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        apartmentTypeId: booking.apartmentTypeId,
        unitId: booking.unitId,
        guestFullName: booking.guest.fullName,
        guestEmail: booking.guest.email,
        guestPhone: booking.guest.phone,
        guestCount: booking.guest.guests,
        specialRequests: booking.guest.specialRequests,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        status: toPrismaStatus(booking.status),
        subtotal: booking.subtotal,
        serviceCharge: booking.serviceCharge,
        total: booking.total,
        createdAt: new Date(booking.createdAt),
        expiresAt: booking.expiresAt ? new Date(booking.expiresAt) : null
      },
      create: {
        id: booking.id,
        apartmentTypeId: booking.apartmentTypeId,
        unitId: booking.unitId,
        guestFullName: booking.guest.fullName,
        guestEmail: booking.guest.email,
        guestPhone: booking.guest.phone,
        guestCount: booking.guest.guests,
        specialRequests: booking.guest.specialRequests,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        status: toPrismaStatus(booking.status),
        subtotal: booking.subtotal,
        serviceCharge: booking.serviceCharge,
        total: booking.total,
        createdAt: new Date(booking.createdAt),
        expiresAt: booking.expiresAt ? new Date(booking.expiresAt) : null
      },
      include: {
        unit: true,
        payments: {
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (booking.paymentReference && booking.paymentMethod && booking.paymentStatus) {
      await prisma.payment.upsert({
        where: { reference: booking.paymentReference },
        update: {
          bookingId: booking.id,
          method: toPrismaPaymentMethod(booking.paymentMethod),
          status: toPrismaPaymentStatus(booking.paymentStatus),
          amount: booking.total
        },
        create: {
          bookingId: booking.id,
          method: toPrismaPaymentMethod(booking.paymentMethod),
          status: toPrismaPaymentStatus(booking.paymentStatus),
          reference: booking.paymentReference,
          amount: booking.total
        }
      });

      const refreshedRecord = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          unit: true,
          payments: {
            take: 1,
            orderBy: { createdAt: "desc" }
          }
        }
      });

      return refreshedRecord ? mapPrismaBooking(refreshedRecord) : memoryBooking;
    }

    return mapPrismaBooking(record);
  } catch {
    return memoryBooking;
  }
}

export function updateBooking(id: string, patch: Partial<Booking>) {
  const booking = getBookingById(id);
  if (!booking) {
    return null;
  }

  Object.assign(booking, patch);
  return booking;
}

export async function updateBookingAsync(id: string, patch: Partial<Booking>) {
  const current = await getBookingByIdAsync(id);
  if (!current) {
    return null;
  }

  const next = { ...current, ...patch, guest: patch.guest ? { ...current.guest, ...patch.guest } : current.guest };
  return saveBookingAsync(next);
}

export function addBlackout(blockout: Omit<BlockedDateRange, "id">) {
  const record: BlockedDateRange = {
    id: `block-${Date.now()}`,
    ...blockout
  };
  blackoutStore.unshift(record);
  return record;
}

export async function addBlackoutAsync(blockout: Omit<BlockedDateRange, "id">) {
  const memoryBlackout = addBlackout(blockout);

  if (!hasDatabase()) {
    return memoryBlackout;
  }

  try {
    const record = await prisma.blockedDateRange.create({
      data: {
        apartmentTypeId: blockout.apartmentTypeId,
        startDate: new Date(blockout.startDate),
        endDate: new Date(blockout.endDate),
        reason: blockout.reason
      }
    });

    return mapPrismaBlackout(record);
  } catch {
    return memoryBlackout;
  }
}

export function getBlackouts() {
  return blackoutStore;
}

export async function getBlackoutsAsync() {
  if (!hasDatabase()) {
    return blackoutStore;
  }

  try {
    const records = await prisma.blockedDateRange.findMany({
      orderBy: { startDate: "asc" }
    });

    return records.length ? records.map(mapPrismaBlackout) : blackoutStore;
  } catch {
    return blackoutStore;
  }
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

export async function createDraftHoldAsync(params: {
  apartmentTypeId: ApartmentTypeId;
  unitId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  const hold = createDraftHold(params);
  return saveBookingAsync(hold);
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

export async function getAdminSummaryAsync() {
  const activeBookings = await getActiveBookingsAsync();
  const confirmed = activeBookings.filter((booking) => booking.status === "confirmed");
  const pending = activeBookings.filter(
    (booking) => booking.status === "draft_hold" || booking.status === "pending_payment"
  );

  return {
    inventory: apartmentTypes.reduce((sum, apartment) => sum + apartment.units, 0),
    confirmedBookings: confirmed.length,
    pendingBookings: pending.length,
    grossRevenue: confirmed.reduce((sum, booking) => sum + booking.total, 0)
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
