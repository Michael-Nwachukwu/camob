import { NextResponse } from "next/server";
import { addBlackout, getBlackouts } from "@/lib/services/repository";
import { blackoutSchema } from "@/lib/validators/booking";

export async function GET() {
  return NextResponse.json({ blackouts: getBlackouts() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = blackoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid blackout payload." }, { status: 400 });
  }

  const blackout = addBlackout(parsed.data);
  return NextResponse.json({ blackout }, { status: 201 });
}
