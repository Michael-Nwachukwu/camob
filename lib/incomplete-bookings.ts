// Browser-only store of in-flight bookings that haven't been paid yet, so a
// guest who bounces off the Paystack page (or just navigates away) can get back
// to finish. Source of truth is still the server — the pill re-checks each
// entry's status on mount and drops anything no longer resumable. This is only
// a convenience pointer (id + signed token), never authoritative booking state.

const KEY = "camob:incomplete-bookings";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type IncompleteBooking = {
  id: string;
  token: string;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  total: number;
  expiresAt: string | null;
  savedAt: number;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): IncompleteBooking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as IncompleteBooking[]) : [];
  } catch {
    return [];
  }
}

function write(list: IncompleteBooking[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Quota/availability failures are non-fatal — the pill just won't persist.
  }
}

// Cheap local prune so we don't hit the API for clearly-dead entries: drop
// anything whose stay is already in the past or that we saved over a day ago.
function prune(list: IncompleteBooking[]): IncompleteBooking[] {
  const today = todayIso();
  const now = Date.now();
  return list.filter((b) => b.checkOut > today && now - b.savedAt < MAX_AGE_MS);
}

export function loadIncompleteBookings(): IncompleteBooking[] {
  const pruned = prune(read());
  write(pruned);
  return pruned;
}

export function saveIncompleteBooking(booking: IncompleteBooking) {
  const list = read().filter((b) => b.id !== booking.id);
  list.push(booking);
  write(prune(list));
}

export function removeIncompleteBooking(id: string) {
  write(read().filter((b) => b.id !== id));
}
