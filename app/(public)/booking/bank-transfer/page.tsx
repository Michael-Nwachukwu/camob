import Link from "next/link";
import { notFound } from "next/navigation";
import { Landmark, MessageCircle } from "lucide-react";
import { siteCopy } from "@/lib/data/camob";
import { getBookingByIdAsync } from "@/lib/services/repository";
import { verifyBookingToken } from "@/lib/booking-tokens";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ bookingId?: string; token?: string }>;
}) {
  const { bookingId, token } = await searchParams;

  if (!bookingId || !verifyBookingToken(bookingId, token)) {
    notFound();
  }

  const booking = await getBookingByIdAsync(bookingId);
  if (!booking) {
    notFound();
  }

  const { bankTransfer } = siteCopy;

  return (
    <div className="pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <Link href="/" className="font-serif text-sm italic text-mute hover:text-ink">
          ← Back to the residence
        </Link>

        <div className="mt-6 rounded-lg bg-canvas p-8 shadow-scrim md:p-12">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-ink">
            <Landmark className="h-6 w-6" />
          </span>
          <p className="mt-6 font-serif text-sm italic text-mute">— send the transfer</p>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.05] text-ink md:text-[52px]" style={{ letterSpacing: "-1.2px" }}>
            Your stay is <span className="italic text-brand">held</span> for 15 minutes.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-[1.6] text-body md:text-lg">
            {bankTransfer.instructions}
          </p>

          {/* Amount + dates */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Stat label="Amount" value={formatCurrency(booking.total)} accent />
            <Stat label="Check-in" value={formatDate(booking.checkIn)} />
            <Stat label="Check-out" value={formatDate(booking.checkOut)} />
          </div>

          {/* Account details */}
          <div className="mt-8 rounded-md bg-surface-card p-6 md:p-7">
            <p className="font-serif text-sm italic text-mute">— transfer to</p>
            <div className="mt-3 space-y-3">
              <Field label="Bank" value={bankTransfer.bankName} />
              <Field label="Account name" value={bankTransfer.accountName} />
              <Field label="Account number" value={bankTransfer.accountNumber} mono />
              <Field
                label="Reference"
                value={booking.paymentReference ?? booking.id}
                mono
              />
            </div>
          </div>

          {/* What happens next */}
          <div className="mt-8 rounded-md bg-surface-soft p-6 md:p-7">
            <p className="font-serif text-base italic text-ink">What happens next</p>
            <ul className="mt-3 space-y-2 text-sm leading-[1.6] text-body md:text-base">
              <li>1. Send the transfer using the reference above.</li>
              <li>2. We watch for it; when it lands, we mark your booking confirmed.</li>
              <li>3. You'll get an email — usually within a couple of hours.</li>
              <li>
                4. If anything looks off, message us on{" "}
                <a href={siteCopy.whatsapp} className="font-semibold text-ink underline" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>{" "}
                with your reference.
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/booking/${booking.id}?token=${token}`}
              className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm font-bold text-canvas hover:bg-ink-soft"
            >
              View booking status
            </Link>
            <a
              href={siteCopy.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-surface-card px-5 text-sm font-bold text-ink hover:bg-surface-deep"
            >
              <MessageCircle className="h-4 w-4" /> Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md bg-surface-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{label}</p>
      <p className={`mt-1.5 font-serif ${accent ? "text-2xl text-brand" : "text-lg text-ink"}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">{label}</span>
      <span className={`text-base text-ink ${mono ? "font-mono" : "font-semibold"}`}>{value}</span>
    </div>
  );
}

