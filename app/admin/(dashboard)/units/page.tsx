import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ActionForm, type ActionResult } from "@/components/admin/action-form";
import { apartmentTypes } from "@/lib/data/camob";
import { getRateAsync, getUnits, updateRateAsync } from "@/lib/services/repository";
import { rateSchema } from "@/lib/validators/booking";
import { formatCurrency } from "@/lib/utils";

async function updateRates(formData: FormData): Promise<ActionResult> {
  "use server";
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Your session expired — sign in again." };
  }
  const parsed = rateSchema.safeParse({
    apartmentTypeId: formData.get("apartmentTypeId"),
    nightlyRate: formData.get("nightlyRate"),
    serviceCharge: formData.get("serviceCharge")
  });
  if (!parsed.success) {
    return { ok: false, error: "Nightly rate must be at least ₦1 and service charge can't be negative." };
  }
  try {
    await updateRateAsync(parsed.data.apartmentTypeId, parsed.data.nightlyRate, parsed.data.serviceCharge);
    revalidatePath("/admin/units");
    revalidatePath("/book");
    revalidatePath("/");
    return { ok: true, message: "Rates updated." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't update rates." };
  }
}

export default async function Page() {
  const rates = await Promise.all(
    apartmentTypes.map(async (apartment) => ({
      apartmentId: apartment.id,
      rate: await getRateAsync(apartment.id)
    }))
  );

  return (
    <div className="space-y-6">
      <section>
        <p className="font-serif text-sm italic text-mute">— inventory</p>
        <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
          Units & rates
        </h2>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {apartmentTypes.map((apartment) => {
          const rate =
            rates.find((entry) => entry.apartmentId === apartment.id)?.rate ?? {
              nightlyRate: apartment.ratePerNight,
              serviceCharge: 0
            };
          const apartmentUnits = getUnits(apartment.id);

          return (
            <div key={apartment.id} className="rounded-lg bg-canvas p-7 shadow-ambient md:p-8">
              <p className="font-serif text-sm italic text-mute">— {apartment.shortName.toLowerCase()}</p>
              <h3 className="mt-1 font-serif text-2xl text-ink md:text-3xl" style={{ letterSpacing: "-0.4px" }}>
                {apartment.name}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-[1.6] text-body">{apartment.description}</p>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <Stat label="Rate / night" value={formatCurrency(rate.nightlyRate)} accent />
                <Stat label="Service charge" value={formatCurrency(rate.serviceCharge)} />
                <Stat label="Sleeps" value={`${apartment.maxGuests} guests`} />
                <Stat label="Units" value={`${apartmentUnits.length}`} />
              </dl>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Configured units</p>
                <ul className="mt-2 space-y-1 text-sm text-body">
                  {apartmentUnits.map((unit) => (
                    <li key={unit.id} className="font-serif">
                      <span className="text-ink">{unit.name}</span>
                      <span className="text-mute"> · {unit.floorLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </section>

      <ActionForm
        action={updateRates}
        loadingText="Saving rates…"
        successText="Rates updated."
        className="rounded-lg bg-canvas p-7 shadow-ambient md:p-8"
      >
        <p className="font-serif text-sm italic text-mute">— change pricing</p>
        <h3 className="mt-1 font-serif text-2xl text-ink md:text-3xl" style={{ letterSpacing: "-0.4px" }}>
          Rate override
        </h3>
        <p className="mt-2 max-w-xl text-sm text-body">
          Saves to the active rate plan. Public pricing on the home + booking pages updates on next render.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Apartment</label>
            <select
              name="apartmentTypeId"
              className="mt-1.5 h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline focus:outline-none focus:ring-2 focus:ring-focus-ring"
            >
              <option value="one-bedroom">1-Bedroom Maisonette</option>
              <option value="two-bedroom">2-Bedroom Maisonette</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Nightly rate (₦)</label>
            <input
              name="nightlyRate"
              type="number"
              required
              min={1}
              placeholder="95000"
              className="mt-1.5 h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">Service charge (₦)</label>
            <input
              name="serviceCharge"
              type="number"
              required
              min={0}
              placeholder="15000"
              className="mt-1.5 h-11 w-full rounded-md bg-canvas px-3 text-sm text-ink ring-1 ring-hairline placeholder:text-ash focus:outline-none focus:ring-2 focus:ring-focus-ring"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-white shadow-ambient transition-all hover:-translate-y-0.5 hover:bg-brand-pressed"
        >
          Save rates
        </button>
      </ActionForm>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md bg-surface-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">{label}</p>
      <p className={`mt-1 font-serif ${accent ? "text-2xl text-brand" : "text-lg text-ink"}`}>{value}</p>
    </div>
  );
}
