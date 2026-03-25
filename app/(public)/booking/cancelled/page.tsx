import Link from "next/link";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="rounded-[2rem] bg-white p-10 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Booking Cancelled</p>
        <h1 className="mt-4 font-serif text-5xl text-primary">Your checkout was not completed.</h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          No problem. You can return to the availability calendar, hold your dates again, and finish the reservation whenever you are ready.
        </p>
        <Link href="/book" className="mt-8 inline-flex rounded-full bg-silk px-6 py-3 font-semibold text-white">
          Return to booking
        </Link>
      </div>
    </div>
  );
}
