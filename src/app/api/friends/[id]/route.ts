import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const friendship = await prisma.friendship.findUnique({ where: { id: params.id } });
  if (!friendship || (friendship.requesterId !== userId && friendship.addresseeId !== userId)) {
    return NextResponse.json({ error: "Friend request not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === "accept") {
    if (friendship.addresseeId !== userId) {
      return NextResponse.json({ error: "Only the recipient can accept this request." }, { status: 403 });
    }
    await prisma.friendship.update({ where: { id: friendship.id }, data: { status: "accepted" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "decline" || action === "remove") {
    await prisma.friendship.delete({ where: { id: friendship.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
