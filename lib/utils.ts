import { clsx } from "clsx";
import { differenceInCalendarDays, format, isAfter, isBefore, parseISO } from "date-fns";

export function cn(...values: Array<string | undefined | false | null>) {
  return clsx(values);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(value);
}

export function nightsBetween(checkIn: string, checkOut: string) {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

export function formatDate(value: string, pattern = "MMM d, yyyy") {
  return format(parseISO(value), pattern);
}

export function isDateInRange(date: string, start: string, end: string) {
  const current = parseISO(date);
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return (current.getTime() === startDate.getTime() || isAfter(current, startDate)) && isBefore(current, endDate);
}
