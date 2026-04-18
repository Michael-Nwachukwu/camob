import { NextResponse } from "next/server";
import { updateBookingAsync } from "@/lib/services/repository";
import { bookingUpdateSchema } from "@/lib/validators/booking";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json();
  const parsed = bookingUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking update." }, { status: 400 });
  }

  const { id } = await params;
  const booking = await updateBookingAsync(id, parsed.data);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
