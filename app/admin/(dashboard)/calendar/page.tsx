import { revalidatePath } from "next/cache";
import { CalendarOff } from "lucide-react";
import { auth } from "@/auth";
import { AdminBlackoutCalendar } from "@/components/admin/admin-blackout-calendar";
import type { ActionResult } from "@/components/admin/action-form";
import { addBlackoutAsync, getBlackoutsAsync, getApartmentTypeById } from "@/lib/services/repository";
import { blackoutSchema } from "@/lib/validators/booking";
import { formatDate } from "@/lib/utils";

async function createBlackout(formData: FormData): Promise<ActionResult> {
  "use server";

  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Your session expired — sign in again." };
  }

  const parsed = blackoutSchema.safeParse({
    apartmentTypeId: formData.get("apartmentTypeId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    reason: formData.get("reason")
  });
  if (!parsed.success) {
    return { ok: false, error: "Pick a date range and a reason." };
  }

  try {
    await addBlackoutAsync(parsed.data);
    revalidatePath("/admin/calendar");
    return { ok: true, message: "Dates blocked." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't save the blackout." };
  }
}

export default async function Page() {
  const blackouts = await getBlackoutsAsync();

  return (
    <div className="space-y-6">
      <section>
        <p className="font-serif text-sm italic text-mute">— calendar</p>
        <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
          Blackouts
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic text-mute">
          Click a start date and an end date on the grid to block a window. Booked and already-blocked days are
          greyed out so you can't accidentally double-up.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Click-to-blackout calendar */}
        <AdminBlackoutCalendar createBlackout={createBlackout} />

        {/* Existing blackouts list */}
        <section className="rounded-lg bg-canvas p-6 shadow-ambient md:p-7">
          <p className="font-serif text-sm italic text-mute">— current blackouts</p>
          <h3 className="mt-1 font-serif text-xl text-ink">{blackouts.length} on the books</h3>

          <div className="mt-5 space-y-3">
            {blackouts.map((block) => {
              const apartment = getApartmentTypeById(block.apartmentTypeId);
              return (
                <div key={block.id} className="rounded-md bg-surface-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
                        {apartment?.shortName ?? block.apartmentTypeId}
                      </p>
                      <p className="mt-1 font-serif text-base text-ink">
                        {formatDate(block.startDate)} → {formatDate(block.endDate)}
                      </p>
                    </div>
                    <CalendarOff className="h-5 w-5 text-mute" />
                  </div>
                  <p className="mt-2 text-sm leading-[1.6] text-body">{block.reason}</p>
                </div>
              );
            })}
            {blackouts.length === 0 ? (
              <p className="rounded-md bg-surface-card px-5 py-8 text-center font-serif text-sm italic text-mute">
                Nothing blocked. All dates open.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
