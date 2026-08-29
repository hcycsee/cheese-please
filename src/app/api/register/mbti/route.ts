import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { MBTI_TYPES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const skip = body?.skip === true;
  const mbti = typeof body?.mbti === "string" ? body.mbti : "";

  if (!skip && !MBTI_TYPES.includes(mbti as any)) {
    return NextResponse.json({ error: "Please select a valid MBTI type or skip this step." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { mbti: skip ? null : mbti, onboardingStep: 5 },
  });

  return NextResponse.json({ onboardingStep: user.onboardingStep });
}
