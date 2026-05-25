import { addDays, addMinutes, parseISO } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ApartmentTypeId, Booking } from "@/lib/types";
import { units } from "@/lib/data/camob";
import { BLOCKING_STATUSES_DB } from "@/lib/booking-status";

const SERIALIZATION_FAILURE_CODES = new Set(["40001", "P2034"]);

function isSerializationFailure(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (SERIALIZATION_FAILURE_CODES.has(error.code)) return true;
    const meta = error.meta as { code?: string } | undefined;
    if (meta?.code && SERIALIZATION_FAILURE_CODES.has(meta.code)) return true;
  }
  return false;
}

async function withSerializableRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isSerializationFailure(error)) throw error;
      // Brief jittered backoff before retrying.
      await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50));
    }
  }
  throw lastError;
}

export async function createBookingHoldTransactional(input: {
  apartmentTypeId: ApartmentTypeId;
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<Booking> {
  const checkInDate = parseISO(input.checkIn);
  const checkOutDate = parseISO(input.checkOut);
  const apartmentUnits = units.filter((unit) => unit.apartmentTypeId === input.apartmentTypeId);

  if (apartmentUnits.length === 0) {
    throw new Error("No units configured for this apartment type");
  }

  const created = await withSerializableRetry(() =>
    prisma.$transaction(
      async (tx) => {
        // Inside the transaction, re-check blackouts and active bookings for overlap.
        const overlappingBlackout = await tx.blockedDateRange.findFirst({
          where: {
            apartmentTypeId: input.apartmentTypeId,
            startDate: { lt: checkOutDate },
            endDate: { gte: checkInDate }
          }
        });

        if (overlappingBlackout) {
          throw new HoldUnavailableError("Selected dates are blocked");
        }

        const overlappingBookings = await tx.booking.findMany({
          where: {
            apartmentTypeId: input.apartmentTypeId,
            status: { in: BLOCKING_STATUSES_DB as unknown as Prisma.EnumBookingStatusFilter["in"] },
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate }
          },
          select: { unitId: true }
        });

        const occupiedUnitIds = new Set(overlappingBookings.map((booking) => booking.unitId));
        const freeUnit = apartmentUnits.find((unit) => !occupiedUnitIds.has(unit.id));

        if (!freeUnit) {
          throw new HoldUnavailableError("Selected dates are no longer available");
        }

        const expiresAt = addMinutes(new Date(), 15);

        const hold = await tx.booking.create({
          data: {
            apartmentTypeId: input.apartmentTypeId,
            unitId: freeUnit.id,
            guestFullName: "Guest hold",
            guestEmail: "hold@camobresidence.local",
            guestPhone: "",
            guestCount: input.guests,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            status: "DRAFT_HOLD",
            subtotal: 0,
            serviceCharge: 0,
            total: 0,
            expiresAt
          },
          include: {
            unit: true,
            payments: { take: 1, orderBy: { createdAt: "desc" } }
          }
        });

        return hold;
      },
      { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 }
    )
  );

  // We need a domain Booking, not the Prisma row. Map in the caller via repository.mapPrismaBooking().
  return {
    id: created.id,
    apartmentTypeId: created.apartmentTypeId as ApartmentTypeId,
    unitId: created.unitId,
    checkIn: created.checkIn.toISOString().slice(0, 10),
    checkOut: created.checkOut.toISOString().slice(0, 10),
    status: "draft_hold",
    guest: {
      fullName: created.guestFullName,
      email: created.guestEmail,
      phone: created.guestPhone,
      guests: created.guestCount,
      specialRequests: created.specialRequests ?? undefined
    },
    subtotal: created.subtotal,
    serviceCharge: created.serviceCharge,
    total: created.total,
    createdAt: created.createdAt.toISOString(),
    expiresAt: created.expiresAt?.toISOString()
  };
}

/** Thrown inside the transaction so we can distinguish "no inventory" from infra errors. */
export class HoldUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HoldUnavailableError";
  }
}

/** Sweep expired DRAFT_HOLD bookings. Returns the number flipped. */
export async function expireStaleHolds(): Promise<number> {
  const result = await prisma.booking.updateMany({
    where: {
      status: "DRAFT_HOLD",
      expiresAt: { lt: new Date() }
    },
    data: { status: "EXPIRED" }
  });
  return result.count;
}

/** Convenience for callers that want the day-after-checkOut window for blackouts/etc. */
export function exclusiveEnd(date: Date): Date {
  return addDays(date, 1);
}
