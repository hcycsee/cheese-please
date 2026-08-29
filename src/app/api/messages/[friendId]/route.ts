import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: { friendId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: userId, addresseeId: params.friendId },
        { requesterId: params.friendId, addresseeId: userId },
      ],
    },
  });
  if (!friendship) return NextResponse.json({ error: "You're not friends with that user." }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: params.friendId },
        { senderId: params.friendId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({ messages });
}
