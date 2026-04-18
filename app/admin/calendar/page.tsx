import { revalidatePath } from "next/cache";
import { addBlackoutAsync, getBlackoutsAsync } from "@/lib/services/repository";

export default async function Page() {
  const blackouts = await getBlackoutsAsync();

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <form
        action={async (formData) => {
          "use server";
          await addBlackoutAsync({
            apartmentTypeId: String(formData.get("apartmentTypeId")) as "one-bedroom" | "two-bedroom",
            startDate: String(formData.get("startDate")),
            endDate: String(formData.get("endDate")),
            reason: String(formData.get("reason"))
          });
          revalidatePath("/admin/calendar");
        }}
        className="rounded-[2rem] bg-white p-8 shadow-ambient"
      >
        <h2 className="font-serif text-3xl text-primary">Add blackout</h2>
        <div className="mt-6 space-y-5">
          <select name="apartmentTypeId" className="w-full rounded-2xl border border-outline bg-surface-low px-4 py-3">
            <option value="one-bedroom">1-Bedroom</option>
            <option value="two-bedroom">2-Bedroom</option>
          </select>
          <input name="startDate" type="date" required className="w-full rounded-2xl border border-outline bg-surface-low px-4 py-3" />
          <input name="endDate" type="date" required className="w-full rounded-2xl border border-outline bg-surface-low px-4 py-3" />
          <textarea name="reason" required rows={4} className="w-full rounded-2xl border border-outline bg-surface-low px-4 py-3" />
        </div>
        <button className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-white">Save blackout</button>
      </form>

      <section className="rounded-[2rem] bg-white p-8 shadow-ambient">
        <h2 className="font-serif text-3xl text-primary">Current blackout windows</h2>
        <div className="mt-6 space-y-4">
          {blackouts.map((block) => (
            <div key={block.id} className="rounded-[1.5rem] bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{block.apartmentTypeId}</p>
              <p className="mt-2 font-semibold text-primary">
                {block.startDate} to {block.endDate}
              </p>
              <p className="mt-2 text-sm text-muted">{block.reason}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
