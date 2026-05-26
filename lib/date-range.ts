// Date-only values ("YYYY-MM-DD") are always interpreted at UTC midnight so
// behaviour is identical on every server, regardless of its timezone.
//
// Do NOT use date-fns `parseISO` for these: it parses "YYYY-MM-DD" in LOCAL
// time, which on UTC+ zones (e.g. Nigeria/WAT) shifts the day boundary back an
// hour. Since stored dates are written at UTC midnight (`new Date("YYYY-MM-DD")`),
// mixing the two made back-to-back bookings (a check-in on the prior stay's
// checkout day) look like an overlap.
export function toUtcDate(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00.000Z`);
}

// Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd).
// Back-to-back stays (aEnd === bStart) do NOT overlap — the checkout morning
// is free for the next guest's check-in.
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toUtcDate(aStart) < toUtcDate(bEnd) && toUtcDate(aEnd) > toUtcDate(bStart);
}
