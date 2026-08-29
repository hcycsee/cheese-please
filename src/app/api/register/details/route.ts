import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { FACULTIES, GENDERS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const gender = typeof body?.gender === "string" ? body.gender : "";
  const faculty = typeof body?.faculty === "string" ? body.faculty : "";
  const age = body?.age === "" || body?.age == null ? null : Number(body.age);

  if (!GENDERS.includes(gender as any)) {
    return NextResponse.json({ error: "Please select a gender." }, { status: 400 });
  }
  if (!FACULTIES.includes(faculty as any)) {
    return NextResponse.json({ error: "Please select a faculty." }, { status: 400 });
  }
  if (age == null || !Number.isFinite(age) || age < 13 || age > 120) {
    return NextResponse.json({ error: "Please enter a valid age." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { gender, faculty, age, onboardingStep: 4 },
  });

  return NextResponse.json({ onboardingStep: user.onboardingStep });
}
