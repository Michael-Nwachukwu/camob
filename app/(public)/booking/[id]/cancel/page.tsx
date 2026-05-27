import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, MessageCircle } from "lucide-react";
import { siteCopy, apartmentTypes } from "@/lib/data/camob";
import { getBookingByIdAsync } from "@/lib/services/repository";
import { cancelBookingAsync, canCancel, computeRefund } from "@/lib/services/refunds";
import { sendBookingNotification } from "@/lib/services/notifications";
import { verifyBookingToken } from "@/lib/booking-tokens";
import { CancelConfirm } from "@/components/booking/cancel-confirm";
import { formatCurrency, formatDate } from "@/lib/utils";

type CancelResult = { ok: true; redirectTo: string } | { ok: false; error: string };

async function confirmCancellation(id: string, token: string): Promise<CancelResult> {
  "use server";
  if (!verifyBookingToken(id, token)) {
    return { ok: false, error: "This cancellation link isn't valid." };
  }

  try {
    const result = await cancelBookingAsync(id);
    await sendBookingNotification({
      event: "booking_cancelled",
      booking: result.booking,
      token
    });
    return { ok: true, redirectTo: `/booking/${id}?token=${token}&cancelled=1` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't cancel the booking." };
  }
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!verifyBookingToken(id, token)) {
    notFound();
  }

  const booking = await getBookingByIdAsync(id);
  if (!booking) {
    notFound();
  }

  const apartment = apartmentTypes.find((item) => item.id === booking.apartmentTypeId);

  // Already-terminal or past stays: explain, don't offer a confirm button.
  if (!canCancel(booking)) {
    return (
      <Shell>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-mute">
          <AlertCircle className="h-6 w-6" />
        </span>
        <p className="mt-6 font-serif text-sm italic text-mute">— nothing to cancel</p>
        <h1 className="mt-3 font-serif text-[32px] leading-[1.05] text-ink md:text-[44px]" style={{ letterSpacing: "-1px" }}>
          This booking can't be <span className="italic text-brand">cancelled</span>.
        </h1>
        <p className="mt-4 text-base leading-[1.6] text-body">
          It's either already cancelled, refunded, or the stay has started. If something looks wrong, message us
          and we'll sort it.
        </p>
        <Actions id={id} token={token!} />
      </Shell>
    );
  }

  const refund = computeRefund(booking);
  const wasPaid = booking.paymentStatus === "paid";

  return (
    <Shell>
      <p className="font-serif text-sm italic text-mute">— cancel a stay</p>
      <h1 className="mt-3 font-serif text-[32px] leading-[1.05] text-ink md:text-[44px]" style={{ letterSpacing: "-1px" }}>
        Cancel your <span className="italic text-brand">{apartment?.shortName}</span> booking?
      </h1>
      <p className="mt-4 text-base leading-[1.6] text-body">
        {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}. {siteCopy.cancellationPolicy.summary}
      </p>

      {/* Refund breakdown */}
      <div className="mt-7 rounded-md bg-surface-card p-6">
        <p className="font-serif text-sm italic text-mute">— where you stand</p>
        <p className="mt-1 text-sm text-body">{refund.label} · {refund.refundPct}% of the room cost back</p>
        <dl className="mt-4 space-y-2.5 text-sm">
          <Row label="Paid" value={wasPaid ? formatCurrency(booking.total) : "Not paid yet"} />
          {wasPaid ? (
            <>
              <Row label="Refund to you" value={formatCurrency(refund.refundAmount)} accent />
              {!refund.serviceChargeRefundable && refund.refundPct > 0 ? (
                <p className="pt-1 text-xs italic text-mute">Service charge ({formatCurrency(booking.serviceCharge)}) is non-refundable.</p>
              ) : null}
            </>
          ) : (
            <p className="pt-1 text-xs italic text-mute">No payment has cleared, so there's nothing to refund — we'll just release the dates.</p>
          )}
        </dl>
      </div>

      <div className="mt-7">
        <CancelConfirm
          id={id}
          token={token!}
          cancel={confirmCancellation}
          label={wasPaid && refund.refundAmount > 0 ? "Cancel & request refund" : "Cancel this booking"}
        />
      </div>

      <a
        href={siteCopy.whatsapp}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 font-serif text-sm italic text-mute hover:text-ink"
      >
        <MessageCircle className="h-4 w-4" /> Or talk to us first on WhatsApp
      </a>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-2xl px-4 md:px-6">
        <div className="rounded-lg bg-canvas p-8 shadow-scrim md:p-12">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-mute">{label}</dt>
      <dd className={accent ? "font-serif text-xl text-brand" : "font-semibold text-ink"}>{value}</dd>
    </div>
  );
}

function Actions({ id, token }: { id: string; token: string }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href={`/booking/${id}?token=${token}`}
        className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-sm font-bold text-canvas hover:bg-ink-soft"
      >
        Back to booking
      </Link>
      <a
        href={siteCopy.whatsapp}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-12 items-center gap-2 rounded-full bg-surface-card px-5 text-sm font-bold text-ink hover:bg-surface-deep"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp us
      </a>
    </div>
  );
}
