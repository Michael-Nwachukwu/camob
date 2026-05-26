import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { auth } from "@/auth";
import { ManualBookingForm } from "@/components/admin/manual-booking-form";
import { createManualBookingAsync } from "@/lib/services/booking";
import { manualBookingSchema } from "@/lib/validators/booking";

type ManualBookingInput = z.infer<typeof manualBookingSchema>;
type ActionResult = { ok: true; bookingId: string } | { ok: false; error: string };

async function createManualBooking(input: ManualBookingInput): Promise<ActionResult> {
  "use server";

  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Your session expired — sign in again." };
  }

  const parsed = manualBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid booking details." };
  }

  try {
    const result = await createManualBookingAsync(parsed.data);
    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    return { ok: true, bookingId: result.booking.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Couldn't create the booking." };
  }
}

export default function Page() {
  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1 font-serif text-sm italic text-mute hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to bookings
      </Link>

      <section>
        <p className="font-serif text-sm italic text-mute">— off-platform reservation</p>
        <h2 className="mt-1 font-serif text-3xl text-ink md:text-4xl" style={{ letterSpacing: "-0.6px" }}>
          Manual booking
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic text-mute">
          For walk-ins or WhatsApp guests who paid outside the website. Runs the same race-safe unit
          allocation as a public booking — the dates must be free.
        </p>
      </section>

      <ManualBookingForm createManualBooking={createManualBooking} />
    </div>
  );
}
