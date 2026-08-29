import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

// NOTE: this is a placeholder "verification" for demo purposes only — it does not
// actually check a real ID document. Swap this out for a real KYC/ID provider or
// institution SSO before using this anywhere that matters.
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const skip = body?.skip === true;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { idVerified: !skip, onboardingStep: 3 },
  });

  return NextResponse.json({ idVerified: user.idVerified, onboardingStep: user.onboardingStep });
}
