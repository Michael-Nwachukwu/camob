"use client";

import { useState } from "react";
import { toast } from "sonner";

export function CompletePaymentButton({ bookingId, token }: { bookingId: string; token: string }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const toastId = toast.loading("Taking you to payment…");
    try {
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, token })
      });
      const payload = await response.json();
      if (response.ok && payload.authorizationUrl) {
        window.location.href = payload.authorizationUrl as string;
        return;
      }
      toast.error(payload.error ?? "Couldn't start payment. Try again or message us.", { id: toastId });
    } catch {
      toast.error("Couldn't reach payment. Check your connection and retry.", { id: toastId });
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed disabled:translate-y-0 disabled:bg-stone disabled:shadow-none"
    >
      {pending ? "Starting payment…" : "Complete payment"}
    </button>
  );
}
