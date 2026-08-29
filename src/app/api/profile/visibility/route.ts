import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, boolean> = {};
  for (const key of ["showGender", "showAge", "showFaculty", "showMbti"] as const) {
    if (typeof body?.[key] === "boolean") data[key] = body[key];
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({
    showGender: user.showGender,
    showAge: user.showAge,
    showFaculty: user.showFaculty,
    showMbti: user.showMbti,
  });
}
