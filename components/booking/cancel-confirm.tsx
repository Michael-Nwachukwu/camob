"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

type CancelResult = { ok: true; redirectTo: string } | { ok: false; error: string };

export function CancelConfirm({
  id,
  token,
  label,
  cancel
}: {
  id: string;
  token: string;
  label: string;
  cancel: (id: string, token: string) => Promise<CancelResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const toastId = toast.loading("Cancelling your booking…");
    startTransition(async () => {
      const result = await cancel(id, token);
      if (result.ok) {
        toast.success("Booking cancelled.", { id: toastId });
        router.push(result.redirectTo);
      } else {
        toast.error(result.error, { id: toastId });
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed disabled:translate-y-0 disabled:bg-stone disabled:shadow-none"
      >
        {pending ? "Cancelling…" : label}
      </button>
      <Link
        href={`/booking/${id}?token=${token}`}
        className="inline-flex h-12 items-center rounded-full bg-surface-card px-6 text-sm font-bold text-ink hover:bg-surface-deep"
      >
        Keep my booking
      </Link>
    </div>
  );
}
