import type { BookingStatus } from "@/lib/types";

const TONE_MAP: Record<BookingStatus, string> = {
  confirmed: "bg-success-pale text-success",
  pending_payment: "bg-surface-card text-ink ring-1 ring-hairline",
  draft_hold: "bg-surface-card text-mute ring-1 ring-hairline",
  cancelled: "bg-surface-card text-danger ring-1 ring-danger/20",
  expired: "bg-surface-card text-mute ring-1 ring-hairline",
  admin_blocked: "bg-surface-card text-danger ring-1 ring-danger/20",
  refund_pending: "bg-surface-card text-ink ring-1 ring-hairline",
  refunded: "bg-surface-card text-mute ring-1 ring-hairline"
};

export function StatusPill({ status }: { status: BookingStatus }) {
  const tone = TONE_MAP[status] ?? TONE_MAP.draft_hold;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
