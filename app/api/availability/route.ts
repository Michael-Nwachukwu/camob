import { NextResponse } from "next/server";
import { getMonthAvailabilityAsync } from "@/lib/services/availability";
import { availabilityQuerySchema } from "@/lib/validators/booking";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse({
    apartmentTypeId: url.searchParams.get("apartmentTypeId") ?? undefined,
    month: url.searchParams.get("month") ?? undefined
  });

  if (!parsed.success || !parsed.data.apartmentTypeId) {
    return NextResponse.json({ error: "Invalid apartment type." }, { status: 400 });
  }

  const days = await getMonthAvailabilityAsync(parsed.data.apartmentTypeId, parsed.data.month);
  return NextResponse.json({ days });
}
