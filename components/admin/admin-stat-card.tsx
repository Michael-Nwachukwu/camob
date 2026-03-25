export function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.75rem] bg-white p-6 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{label}</p>
      <p className="mt-4 font-serif text-4xl text-primary">{value}</p>
    </div>
  );
}
