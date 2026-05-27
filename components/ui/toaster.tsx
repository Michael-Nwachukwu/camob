"use client";

import { Toaster as SonnerToaster } from "sonner";

// App-wide toast surface, themed to the Camob tokens. Mounted once in the
// root layout; trigger from anywhere with `import { toast } from "sonner"`.
// We skip sonner's `richColors` (generic green/red) and tint per-type with the
// brand palette so toasts read as part of the hospitality chrome.
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "rounded-md border border-hairline bg-canvas/95 text-ink shadow-scrim font-sans backdrop-blur-sm",
          title: "text-sm font-semibold text-ink",
          description: "text-[13px] leading-relaxed text-body",
          actionButton: "rounded-full bg-brand px-3 text-xs font-bold text-white hover:bg-brand-pressed",
          cancelButton: "rounded-full bg-surface-card px-3 text-xs font-bold text-ink",
          closeButton: "border border-hairline bg-canvas text-mute hover:text-ink",
          success: "border-success/25 [&_[data-icon]]:text-success",
          error: "border-brand/25 [&_[data-icon]]:text-brand",
          warning: "[&_[data-icon]]:text-brand",
          info: "[&_[data-icon]]:text-ink",
          loading: "[&_[data-icon]]:text-brand"
        }
      }}
    />
  );
}
