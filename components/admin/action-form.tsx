"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * A <form> whose submit runs a server action that RETURNS an ActionResult
 * (never throws for expected failures). Shows a loading toast, then a
 * success/error toast, and refreshes server data on success. Use for the
 * simple admin mutations; complex forms validate client-side first.
 */
export function ActionForm({
  action,
  loadingText,
  successText,
  confirm,
  className,
  children
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  loadingText: string;
  successText: string;
  confirm?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirm && !window.confirm(confirm)) return;
    const formData = new FormData(event.currentTarget);
    const toastId = toast.loading(loadingText);
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        toast.success(result.message ?? successText, { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error, { id: toastId });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={className} data-pending={pending || undefined}>
      {children}
    </form>
  );
}
