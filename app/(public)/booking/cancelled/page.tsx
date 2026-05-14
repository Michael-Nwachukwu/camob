import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function Page() {
  return (
    <div className="bg-surface-soft pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="rounded-lg bg-canvas p-8 md:p-12">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-ink">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="mt-6 font-serif text-sm italic text-mute">— checkout cancelled</p>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.05] text-ink md:text-[56px]" style={{ letterSpacing: "-1.2px" }}>
            No <span className="italic text-brand">harm</span> done.
          </h1>
          <p className="mt-5 text-base leading-[1.6] text-body md:text-lg">
            We didn't take any payment. Head back to the calendar whenever you're
            ready — the dates are usually still open.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="inline-flex h-12 items-center rounded-md bg-brand px-5 text-sm font-bold text-white hover:bg-brand-pressed"
            >
              Try again
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-md bg-surface-card px-5 text-sm font-bold text-ink hover:bg-surface-deep"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
