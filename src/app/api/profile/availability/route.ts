import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { DAYS, PERIODS, slotId } from "@/lib/constants";

const VALID_SLOTS = new Set(DAYS.flatMap((d) => PERIODS.map((p) => slotId(d, p.key))));

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const slots: string[] = Array.isArray(body?.slots)
    ? body.slots.filter((s: unknown) => typeof s === "string" && VALID_SLOTS.has(s))
    : [];

  await prisma.user.update({ where: { id: userId }, data: { availability: JSON.stringify(slots) } });
  return NextResponse.json({ slots });
}
