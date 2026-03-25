import { NextResponse } from "next/server";
import { initializePaystackPayment } from "@/lib/services/payments";
import { paystackInitializeSchema } from "@/lib/validators/booking";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = paystackInitializeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment initialization request." }, { status: 400 });
  }

  try {
    const payload = await initializePaystackPayment(parsed.data.bookingId, parsed.data.email);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to initialize payment." }, { status: 400 });
  }
}
