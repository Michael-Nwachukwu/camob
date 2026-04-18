export type ApartmentTypeId = "one-bedroom" | "two-bedroom";
export type BookingStatus =
  | "draft_hold"
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "admin_blocked"
  | "refund_pending"
  | "refunded";

export type PaymentMethod = "paystack" | "bank_transfer";
export type PaymentStatus = "initialized" | "paid" | "failed" | "pending_review";
export type AvailabilityStatus =
  | "available"
  | "partial"
  | "booked"
  | "selected"
  | "blocked"
  | "past";

export interface ApartmentTypeSummary {
  id: ApartmentTypeId;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  longDescription?: string;
  ratePerNight: number;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  units: number;
  amenities: string[];
  heroImage: string;
  gallery: string[];
}

export interface Unit {
  id: string;
  apartmentTypeId: ApartmentTypeId;
  name: string;
  floorLabel: string;
}

export interface Guest {
  fullName: string;
  email: string;
  phone: string;
  guests: number;
  specialRequests?: string;
}

export interface Booking {
  id: string;
  unitId: string;
  apartmentTypeId: ApartmentTypeId;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  guest: Guest;
  subtotal: number;
  serviceCharge: number;
  total: number;
  createdAt: string;
  expiresAt?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
}

export interface BlockedDateRange {
  id: string;
  apartmentTypeId: ApartmentTypeId;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface RatePlan {
  id?: string;
  apartmentTypeId: ApartmentTypeId;
  nightlyRate: number;
  serviceCharge: number;
  currency: "NGN";
}

export interface NotificationLog {
  id: string;
  channel: "email";
  event: string;
  recipient: string;
  createdAt: string;
}

export interface UnitAvailabilityDay {
  date: string;
  status: AvailabilityStatus;
  availableUnits: number;
  remainingUnits: number;
  price: number;
}

export interface BookingQuote {
  apartmentTypeId: ApartmentTypeId;
  nights: number;
  nightlyRate: number;
  subtotal: number;
  serviceCharge: number;
  total: number;
}

export interface CreateBookingInput {
  apartmentTypeId: ApartmentTypeId;
  checkIn: string;
  checkOut: string;
  paymentMethod: PaymentMethod;
  guest: Guest;
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    metadata?: Record<string, unknown>;
  };
}

export interface AdminBookingRow {
  id: string;
  apartment: string;
  unit: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  total: number;
  paymentMethod?: PaymentMethod;
}

export interface Attraction {
  id: string;
  name: string;
  category: "Beach" | "Nature" | "Retail" | "Dining" | "Culture" | "Sports";
  distanceKm: number;
  driveTime: string;
  description: string;
  image: string;
}
