import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

const MAX_DATA_URL_LENGTH = 500_000; // ~500KB, plenty for a small square avatar

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const dataUrl = typeof body?.dataUrl === "string" ? body.dataUrl : "";
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
    return NextResponse.json({ error: "Invalid image data." }, { status: 400 });
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    return NextResponse.json({ error: "That image is too large." }, { status: 413 });
  }

  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: dataUrl } });
  return NextResponse.json({ avatarUrl: dataUrl });
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
  return NextResponse.json({ ok: true });
}
