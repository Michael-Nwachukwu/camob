import { getNotificationLogsAsync } from "@/lib/services/repository";
import { formatDate } from "@/lib/utils";

export default async function Page() {
  const logs = await getNotificationLogsAsync(200);

  return (
    <div className="space-y-6">
      <section>
        <p className="font-serif text-sm italic text-mute">— who got told what</p>
        <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
          Notification log
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic text-mute">
          Every email we attempted, whether Resend was configured or not. Useful when a guest swears they
          didn't get the confirmation.
        </p>
      </section>

      <section className="rounded-lg bg-canvas shadow-ambient">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.18em] text-mute">
              <tr className="border-b border-hairline">
                <th className="px-6 py-4 font-semibold">When</th>
                <th className="px-3 py-4 font-semibold">Event</th>
                <th className="px-3 py-4 font-semibold">Channel</th>
                <th className="px-3 py-4 font-semibold">Recipient</th>
                <th className="px-3 py-4 font-semibold">Booking</th>
                <th className="px-6 py-4 font-semibold">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const payload = (log.payload ?? {}) as Record<string, unknown>;
                const delivered = payload.delivered === true;
                const skipped = payload.skipped === true;
                const bookingId = typeof payload.bookingId === "string" ? payload.bookingId : null;
                return (
                  <tr key={log.id} className="border-b border-hairline-soft align-top last:border-0">
                    <td className="px-6 py-4 font-serif text-sm italic text-body">
                      {formatDate(log.createdAt.slice(0, 10), "MMM d")}
                      <span className="text-mute"> · {log.createdAt.slice(11, 16)}</span>
                    </td>
                    <td className="px-3 py-4 text-ink capitalize">{log.event.replaceAll("_", " ")}</td>
                    <td className="px-3 py-4 text-body">{log.channel}</td>
                    <td className="px-3 py-4 text-body">{log.recipient}</td>
                    <td className="px-3 py-4 font-mono text-xs text-mute">{bookingId ?? "—"}</td>
                    <td className="px-6 py-4">
                      <OutcomePill delivered={delivered} skipped={skipped} />
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center font-serif text-sm italic text-mute">
                    No notifications yet. Either nobody's booked, or Resend isn't configured and the DB
                    isn't connected.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function OutcomePill({ delivered, skipped }: { delivered: boolean; skipped: boolean }) {
  if (delivered) {
    return (
      <span className="inline-flex rounded-full bg-success-pale px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-success">
        delivered
      </span>
    );
  }
  if (skipped) {
    return (
      <span className="inline-flex rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute ring-1 ring-hairline">
        skipped (no key)
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-surface-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-danger ring-1 ring-danger/20">
      failed
    </span>
  );
}
