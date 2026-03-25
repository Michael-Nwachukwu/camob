import Link from "next/link";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="rounded-[2rem] bg-white p-10 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Booking Success</p>
        <h1 className="mt-4 font-serif text-5xl text-primary">Your reservation has been received.</h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          Reference: <span className="font-semibold text-primary">{params.bookingId ?? "pending"}</span>. If you chose
          Paystack, final confirmation depends on payment verification. If you chose bank transfer, staff will review and
          contact you.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/" className="rounded-full bg-silk px-6 py-3 font-semibold text-white">
            Back to home
          </Link>
          <Link href="/explore" className="rounded-full border border-outline px-6 py-3 font-semibold text-primary">
            Explore Lekki
          </Link>
        </div>
      </div>
    </div>
  );
}
