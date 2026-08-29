import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { displayName } from "@/lib/format";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: { id: true, name: true, preferredName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    blocked: blocks.map((b) => ({ blockId: b.id, user: { id: b.blocked.id, name: displayName(b.blocked) } })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetId = typeof body?.userId === "string" ? body.userId : "";
  if (!targetId || targetId === userId) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: targetId },
          { requesterId: targetId, addresseeId: userId },
        ],
      },
    }),
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
      update: {},
      create: { blockerId: userId, blockedId: targetId },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
