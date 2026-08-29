import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: { groupId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: params.groupId } },
  });
  if (!membership) return NextResponse.json({ error: "You're not in that group." }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { groupId: params.groupId },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true, preferredName: true } } },
  });

  return NextResponse.json({ messages });
}
