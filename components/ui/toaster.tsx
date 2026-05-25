"use client";

import { Toaster as SonnerToaster } from "sonner";

// App-wide toast surface, themed to the Camob tokens. Mounted once in the
// root layout; trigger from anywhere with `import { toast } from "sonner"`.
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-md border border-hairline bg-canvas text-ink shadow-ambient font-sans",
          title: "text-sm font-semibold text-ink",
          description: "text-sm text-body",
          actionButton: "rounded-full bg-brand text-white",
          cancelButton: "rounded-full bg-surface-card text-ink"
        }
      }}
    />
  );
}
