import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[2rem] bg-white p-10 text-center shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">Not Found</p>
        <h1 className="mt-4 font-serif text-5xl text-primary">This page doesn&apos;t exist.</h1>
        <p className="mt-4 text-lg leading-8 text-muted">Try heading back to the residence homepage or the booking flow.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/" className="rounded-full bg-silk px-6 py-3 font-semibold text-white">
            Home
          </Link>
          <Link href="/book" className="rounded-full border border-outline px-6 py-3 font-semibold text-primary">
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}
