import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { publicUser } from "@/lib/format";
import { FACULTIES, GENDERS, MBTI_TYPES } from "@/lib/constants";

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body?.preferredName === "string") data.preferredName = body.preferredName.trim() || null;
  if (typeof body?.institution === "string") data.institution = body.institution.trim() || null;
  if (typeof body?.gender === "string") {
    if (!GENDERS.includes(body.gender as any)) return NextResponse.json({ error: "Invalid gender." }, { status: 400 });
    data.gender = body.gender;
  }
  if (typeof body?.faculty === "string") {
    if (!FACULTIES.includes(body.faculty as any)) return NextResponse.json({ error: "Invalid faculty." }, { status: 400 });
    data.faculty = body.faculty;
  }
  if (body?.age === null || body?.age === "") {
    return NextResponse.json({ error: "Age is required." }, { status: 400 });
  } else if (body?.age != null) {
    const age = Number(body.age);
    if (!Number.isFinite(age) || age < 13 || age > 120) {
      return NextResponse.json({ error: "Invalid age." }, { status: 400 });
    }
    data.age = age;
  }
  if (body?.mbti === null || body?.mbti === "") {
    data.mbti = null;
  } else if (typeof body?.mbti === "string") {
    if (!MBTI_TYPES.includes(body.mbti as any)) return NextResponse.json({ error: "Invalid MBTI type." }, { status: 400 });
    data.mbti = body.mbti;
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json(publicUser(user));
}
