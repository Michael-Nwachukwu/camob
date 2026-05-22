export function AdminStatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-canvas p-6 shadow-ambient md:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{label}</p>
      <p className="mt-3 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
        {value}
      </p>
      {hint ? <p className="mt-2 font-serif text-sm italic text-mute">{hint}</p> : null}
    </div>
  );
}
