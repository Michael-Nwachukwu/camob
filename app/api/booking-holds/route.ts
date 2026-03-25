import { NextResponse } from "next/server";
import { createBookingHold } from "@/lib/services/booking";
import { bookingHoldSchema } from "@/lib/validators/booking";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = bookingHoldSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reservation hold request." }, { status: 400 });
  }

  try {
    const result = createBookingHold(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create hold." }, { status: 400 });
  }
}
