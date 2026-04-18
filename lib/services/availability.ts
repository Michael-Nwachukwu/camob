import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  formatISO,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth
} from "date-fns";
import {
  getActiveBookings,
  getActiveBookingsAsync,
  getApartmentTypeById,
  getBlackouts,
  getBlackoutsAsync,
  getRate,
  getRateAsync,
  getUnits
} from "@/lib/services/repository";
import type { ApartmentTypeId, BookingQuote, UnitAvailabilityDay } from "@/lib/types";
import { isDateInRange, nightsBetween } from "@/lib/utils";

export function calculateQuote(apartmentTypeId: ApartmentTypeId, checkIn: string, checkOut: string): BookingQuote {
  const rate = getRate(apartmentTypeId);
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = rate.nightlyRate * nights;

  return {
    apartmentTypeId,
    nights,
    nightlyRate: rate.nightlyRate,
    subtotal,
    serviceCharge: rate.serviceCharge,
    total: subtotal + rate.serviceCharge
  };
}

export async function calculateQuoteAsync(
  apartmentTypeId: ApartmentTypeId,
  checkIn: string,
  checkOut: string
): Promise<BookingQuote> {
  const rate = await getRateAsync(apartmentTypeId);
  const nights = nightsBetween(checkIn, checkOut);
  const subtotal = rate.nightlyRate * nights;

  return {
    apartmentTypeId,
    nights,
    nightlyRate: rate.nightlyRate,
    subtotal,
    serviceCharge: rate.serviceCharge,
    total: subtotal + rate.serviceCharge
  };
}

export function getMonthAvailability(apartmentTypeId: ApartmentTypeId, monthIso?: string): UnitAvailabilityDay[] {
  const apartment = getApartmentTypeById(apartmentTypeId);
  if (!apartment) {
    return [];
  }

  const monthStart = monthIso ? startOfMonth(parseISO(monthIso)) : startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);
  const interval = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const apartmentUnits = getUnits(apartmentTypeId);
  const bookings = getActiveBookings().filter((booking) => booking.apartmentTypeId === apartmentTypeId);
  const blackouts = getBlackouts().filter((block) => block.apartmentTypeId === apartmentTypeId);
  const rate = getRate(apartmentTypeId);
  const today = startOfDay(new Date());

  return interval.map((date) => {
    const isoDate = formatISO(date, { representation: "date" });
    const occupiedUnits = new Set<string>();

    bookings.forEach((booking) => {
      if (isDateInRange(isoDate, booking.checkIn, booking.checkOut)) {
        occupiedUnits.add(booking.unitId);
      }
    });

    const blocked = blackouts.some((block) =>
      isDateInRange(isoDate, block.startDate, formatISO(addDays(parseISO(block.endDate), 1), { representation: "date" }))
    );
    const remainingUnits = Math.max(apartmentUnits.length - occupiedUnits.size, 0);

    let status: UnitAvailabilityDay["status"] = "available";
    if (isBefore(date, today)) {
      status = "past";
    } else if (blocked) {
      status = "blocked";
    } else if (remainingUnits === 0) {
      status = "booked";
    } else if (remainingUnits < apartmentUnits.length) {
      status = "partial";
    }

    return {
      date: isoDate,
      status,
      availableUnits: apartmentUnits.length,
      remainingUnits,
      price: rate.nightlyRate
    };
  });
}

export async function getMonthAvailabilityAsync(
  apartmentTypeId: ApartmentTypeId,
  monthIso?: string
): Promise<UnitAvailabilityDay[]> {
  const apartment = getApartmentTypeById(apartmentTypeId);
  if (!apartment) {
    return [];
  }

  const monthStart = monthIso ? startOfMonth(parseISO(monthIso)) : startOfMonth(new Date());
  const monthEnd = endOfMonth(monthStart);
  const interval = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const apartmentUnits = getUnits(apartmentTypeId);
  const [bookings, blackouts, rate] = await Promise.all([
    getActiveBookingsAsync(),
    getBlackoutsAsync(),
    getRateAsync(apartmentTypeId)
  ]);
  const apartmentBookings = bookings.filter((booking) => booking.apartmentTypeId === apartmentTypeId);
  const apartmentBlackouts = blackouts.filter((block) => block.apartmentTypeId === apartmentTypeId);
  const today = startOfDay(new Date());

  return interval.map((date) => {
    const isoDate = formatISO(date, { representation: "date" });
    const occupiedUnits = new Set<string>();

    apartmentBookings.forEach((booking) => {
      if (isDateInRange(isoDate, booking.checkIn, booking.checkOut)) {
        occupiedUnits.add(booking.unitId);
      }
    });

    const blocked = apartmentBlackouts.some((block) =>
      isDateInRange(isoDate, block.startDate, formatISO(addDays(parseISO(block.endDate), 1), { representation: "date" }))
    );
    const remainingUnits = Math.max(apartmentUnits.length - occupiedUnits.size, 0);

    let status: UnitAvailabilityDay["status"] = "available";
    if (isBefore(date, today)) {
      status = "past";
    } else if (blocked) {
      status = "blocked";
    } else if (remainingUnits === 0) {
      status = "booked";
    } else if (remainingUnits < apartmentUnits.length) {
      status = "partial";
    }

    return {
      date: isoDate,
      status,
      availableUnits: apartmentUnits.length,
      remainingUnits,
      price: rate.nightlyRate
    };
  });
}

export function isRangeAvailable(apartmentTypeId: ApartmentTypeId, checkIn: string, checkOut: string) {
  const apartmentUnits = getUnits(apartmentTypeId);
  const bookings = getActiveBookings().filter((booking) => booking.apartmentTypeId === apartmentTypeId);
  const blackouts = getBlackouts().filter((block) => block.apartmentTypeId === apartmentTypeId);
  const today = startOfDay(new Date());
  const interval = eachDayOfInterval({
    start: parseISO(checkIn),
    end: addDays(parseISO(checkOut), -1)
  });

  return interval.every((day) => {
    if (isBefore(day, today)) {
      return false;
    }

    const isoDate = formatISO(day, { representation: "date" });
    const occupiedUnits = new Set<string>();

    bookings.forEach((booking) => {
      if (isDateInRange(isoDate, booking.checkIn, booking.checkOut)) {
        occupiedUnits.add(booking.unitId);
      }
    });

    const blocked = blackouts.some((block) =>
      isDateInRange(isoDate, block.startDate, formatISO(addDays(parseISO(block.endDate), 1), { representation: "date" }))
    );

    return !blocked && apartmentUnits.length - occupiedUnits.size > 0;
  });
}

export async function isRangeAvailableAsync(apartmentTypeId: ApartmentTypeId, checkIn: string, checkOut: string) {
  const apartmentUnits = getUnits(apartmentTypeId);
  const [bookings, blackouts] = await Promise.all([getActiveBookingsAsync(), getBlackoutsAsync()]);
  const apartmentBookings = bookings.filter((booking) => booking.apartmentTypeId === apartmentTypeId);
  const apartmentBlackouts = blackouts.filter((block) => block.apartmentTypeId === apartmentTypeId);
  const today = startOfDay(new Date());
  const interval = eachDayOfInterval({
    start: parseISO(checkIn),
    end: addDays(parseISO(checkOut), -1)
  });

  return interval.every((day) => {
    if (isBefore(day, today)) {
      return false;
    }

    const isoDate = formatISO(day, { representation: "date" });
    const occupiedUnits = new Set<string>();

    apartmentBookings.forEach((booking) => {
      if (isDateInRange(isoDate, booking.checkIn, booking.checkOut)) {
        occupiedUnits.add(booking.unitId);
      }
    });

    const blocked = apartmentBlackouts.some((block) =>
      isDateInRange(isoDate, block.startDate, formatISO(addDays(parseISO(block.endDate), 1), { representation: "date" }))
    );

    return !blocked && apartmentUnits.length - occupiedUnits.size > 0;
  });
}

export function findAvailableUnit(apartmentTypeId: ApartmentTypeId, checkIn: string, checkOut: string) {
  const apartmentUnits = getUnits(apartmentTypeId);
  const bookings = getActiveBookings().filter((booking) => booking.apartmentTypeId === apartmentTypeId);

  return apartmentUnits.find((unit) => {
    return !bookings.some((booking) => {
      if (booking.unitId !== unit.id) {
        return false;
      }

      return checkIn < booking.checkOut && checkOut > booking.checkIn;
    });
  });
}

export async function findAvailableUnitAsync(apartmentTypeId: ApartmentTypeId, checkIn: string, checkOut: string) {
  const apartmentUnits = getUnits(apartmentTypeId);
  const bookings = (await getActiveBookingsAsync()).filter((booking) => booking.apartmentTypeId === apartmentTypeId);

  return apartmentUnits.find((unit) => {
    return !bookings.some((booking) => {
      if (booking.unitId !== unit.id) {
        return false;
      }

      return checkIn < booking.checkOut && checkOut > booking.checkIn;
    });
  });
}
