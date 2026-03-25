import { apartmentTypes } from "@/lib/data/camob";
import { getRate, getUnits, updateRate } from "@/lib/services/repository";
import { formatCurrency } from "@/lib/utils";

export default function Page() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-2">
        {apartmentTypes.map((apartment) => {
          const rate = getRate(apartment.id);

          return (
            <div key={apartment.id} className="rounded-[2rem] bg-white p-8 shadow-ambient">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">{apartment.shortName}</p>
              <h2 className="mt-3 font-serif text-3xl text-primary">{apartment.name}</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{apartment.description}</p>
              <div className="mt-5 space-y-2 text-sm text-primary">
                {getUnits(apartment.id).map((unit) => (
                  <p key={unit.id}>
                    {unit.name} • {unit.floorLabel}
                  </p>
                ))}
              </div>
              <p className="mt-6 text-lg font-semibold text-secondary">{formatCurrency(rate.nightlyRate)} per night</p>
            </div>
          );
        })}
      </section>

      <form
        action={async (formData) => {
          "use server";
          updateRate(
            String(formData.get("apartmentTypeId")) as "one-bedroom" | "two-bedroom",
            Number(formData.get("nightlyRate")),
            Number(formData.get("serviceCharge"))
          );
        }}
        className="rounded-[2rem] bg-white p-8 shadow-ambient"
      >
        <h2 className="font-serif text-3xl text-primary">Rate override</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <select name="apartmentTypeId" className="rounded-2xl border border-outline bg-surface-low px-4 py-3">
            <option value="one-bedroom">1-Bedroom</option>
            <option value="two-bedroom">2-Bedroom</option>
          </select>
          <input name="nightlyRate" type="number" placeholder="Nightly rate" className="rounded-2xl border border-outline bg-surface-low px-4 py-3" />
          <input name="serviceCharge" type="number" placeholder="Service charge" className="rounded-2xl border border-outline bg-surface-low px-4 py-3" />
        </div>
        <button className="mt-6 rounded-full bg-primary px-6 py-3 font-semibold text-white">Update rates</button>
      </form>
    </div>
  );
}
