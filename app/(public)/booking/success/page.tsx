import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="bg-surface-soft pb-20 pt-24 md:pt-32">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="rounded-lg bg-canvas p-8 md:p-12">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-pale text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <p className="mt-6 font-serif text-sm italic text-mute">— booking received</p>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.05] text-ink md:text-[56px]" style={{ letterSpacing: "-1.2px" }}>
            We've got <span className="italic text-brand">your reservation</span>.
          </h1>
          <p className="mt-5 text-base leading-[1.6] text-body md:text-lg">
            Reference: <span className="font-semibold text-ink">{params.bookingId ?? "pending"}</span>.
          </p>
          <p className="mt-3 text-base leading-[1.6] text-body">
            If you paid with Paystack, the confirmation lands the moment the
            webhook fires — usually seconds. For bank transfers, we'll review and
            email you back within a few hours.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-md bg-brand px-5 text-sm font-bold text-white hover:bg-brand-pressed"
            >
              Back to the residence
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-12 items-center rounded-md bg-surface-card px-5 text-sm font-bold text-ink hover:bg-surface-deep"
            >
              Plan around Lekki
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
