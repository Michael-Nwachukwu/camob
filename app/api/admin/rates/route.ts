import { NextResponse } from "next/server";
import { updateRate } from "@/lib/services/repository";
import { rateSchema } from "@/lib/validators/booking";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = rateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rate payload." }, { status: 400 });
  }

  const rate = updateRate(parsed.data.apartmentTypeId, parsed.data.nightlyRate, parsed.data.serviceCharge);
  return NextResponse.json({ rate });
}
