import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Landmark, AlertCircle, MessageCircle } from "lucide-react";
import { siteCopy, apartmentTypes } from "@/lib/data/camob";
import { getBookingByIdAsync } from "@/lib/services/repository";
import { canCancel } from "@/lib/services/refunds";
import { verifyBookingToken } from "@/lib/booking-tokens";
import { CompletePaymentButton } from "@/components/booking/complete-payment-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const { token, cancelled } = await searchParams;

  if (!verifyBookingToken(id, token)) {
    notFound();
  }

  const booking = await getBookingByIdAsync(id);
  if (!booking) {
    notFound();
  }

  const apartment = apartmentTypes.find((item) => item.id === booking.apartmentTypeId);
  const state = stateFor(booking);
  const cancellable = canCancel(booking);
  const awaitingRefund = booking.status === "refund_pending";
  const refunded = booking.status === "refunded";

  return (
    <div className="pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <Link href="/" className="font-serif text-sm italic text-mute hover:text-ink">
          ← Back to the residence
        </Link>

        {cancelled ? (
          <div className="mt-6 rounded-md bg-success-pale px-5 py-4 text-sm font-semibold text-success">
            Your cancellation is in. {awaitingRefund ? "We'll process the refund shortly." : "Nothing further owed."}
          </div>
        ) : null}

        <div className="mt-6 rounded-lg bg-canvas p-8 shadow-scrim md:p-12">
          <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${state.iconBg}`}>
            <state.Icon className="h-6 w-6" />
          </span>
          <p className="mt-6 font-serif text-sm italic text-mute">— {state.eyebrow}</p>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.05] text-ink md:text-[52px]" style={{ letterSpacing: "-1.2px" }}>
            {state.headline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-[1.6] text-body md:text-lg">
            {state.body}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Stat label="Reference" value={booking.id} mono />
            <Stat label="Apartment" value={apartment?.name ?? booking.apartmentTypeId} />
            <Stat label="Check-in" value={formatDate(booking.checkIn)} />
            <Stat label="Check-out" value={formatDate(booking.checkOut)} />
            <Stat label="Guests" value={`${booking.guest.guests}`} />
            <Stat label="Total" value={formatCurrency(booking.total)} accent />
          </div>

          {(awaitingRefund || refunded) && booking.refundAmount != null ? (
            <div className="mt-6 rounded-md bg-surface-card p-5">
              <p className="font-serif text-sm italic text-mute">— refund</p>
              <p className="mt-1 text-sm text-body">
                {refunded ? "Refunded" : "Refund pending"}:{" "}
                <span className="font-semibold text-ink">{formatCurrency(booking.refundAmount)}</span>
                {awaitingRefund ? " — usually clears within a few business days." : "."}
              </p>
            </div>
          ) : null}

          {booking.paymentMethod === "paystack" && booking.status === "pending_payment" && booking.paymentStatus !== "paid" ? (
            <div className="mt-8 rounded-md bg-surface-card p-6">
              <p className="font-serif text-base italic text-ink">Finish your payment</p>
              <p className="mt-2 text-sm leading-[1.6] text-body md:text-base">
                Your dates are still held. Pick up where you left off and pay securely with Paystack to lock
                in the stay.
              </p>
              <div className="mt-4">
                <CompletePaymentButton bookingId={booking.id} token={token!} />
              </div>
            </div>
          ) : null}

          {booking.paymentMethod === "bank_transfer" && booking.paymentStatus !== "paid" ? (
            <div className="mt-8 rounded-md bg-surface-card p-6">
              <p className="font-serif text-base italic text-ink">Still need to pay?</p>
              <p className="mt-2 text-sm leading-[1.6] text-body md:text-base">
                You picked bank transfer. Use the details below as the reference; we mark your booking
                confirmed when the credit lands.
              </p>
              <Link
                href={`/booking/bank-transfer?bookingId=${booking.id}&token=${token}`}
                className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-bold text-canvas hover:bg-ink-soft"
              >
                See transfer details
              </Link>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={siteCopy.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-surface-card px-5 text-sm font-bold text-ink hover:bg-surface-deep"
            >
              <MessageCircle className="h-4 w-4" /> Message us on WhatsApp
            </a>
            {cancellable ? (
              <Link
                href={`/booking/${id}/cancel?token=${token}`}
                className="font-serif text-sm italic text-mute underline-offset-4 hover:text-danger hover:underline"
              >
                Cancel this booking
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-md bg-surface-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{label}</p>
      <p
        className={[
          "mt-1.5 font-serif",
          accent ? "text-2xl text-brand" : "text-lg text-ink",
          mono ? "font-mono text-base" : ""
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

type Display = {
  Icon: typeof CheckCircle2;
  iconBg: string;
  eyebrow: string;
  headline: React.ReactNode;
  body: string;
};

function stateFor(booking: Booking): Display {
  if (booking.status === "confirmed" || booking.paymentStatus === "paid") {
    return {
      Icon: CheckCircle2,
      iconBg: "bg-success-pale text-success",
      eyebrow: "you're booked",
      headline: (
        <>
          See you in <span className="italic text-brand">Lekki</span>.
        </>
      ),
      body: "Confirmed. We'll send check-in details closer to the date."
    };
  }

  if (booking.status === "cancelled" || booking.status === "expired") {
    return {
      Icon: AlertCircle,
      iconBg: "bg-surface-card text-danger",
      eyebrow: booking.status === "expired" ? "hold expired" : "cancelled",
      headline: (
        <>
          This booking is <span className="italic text-brand">no longer active</span>.
        </>
      ),
      body:
        booking.status === "expired"
          ? "Your hold lapsed before payment landed. The dates are open again — feel free to start a new booking."
          : "This booking was cancelled. If you didn't do this, message us on WhatsApp."
    };
  }

  if (booking.paymentMethod === "bank_transfer") {
    return {
      Icon: Landmark,
      iconBg: "bg-surface-card text-ink",
      eyebrow: "waiting for transfer",
      headline: (
        <>
          We're holding your <span className="italic text-brand">stay</span>.
        </>
      ),
      body: "We'll mark this booking confirmed as soon as the bank credit comes in. Hold reference handy in case you need to follow up."
    };
  }

  return {
    Icon: Clock,
    iconBg: "bg-surface-card text-ink",
    eyebrow: "payment pending",
    headline: (
      <>
        Almost <span className="italic text-brand">there</span>.
      </>
    ),
    body: "Once Paystack confirms the payment, this page will flip to confirmed. Usually seconds."
  };
}
