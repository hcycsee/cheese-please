import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { isOnline } from "@/lib/presence";

const PROFILE_FIELDS = {
  id: true,
  name: true,
  preferredName: true,
  gender: true,
  faculty: true,
  mbti: true,
} as const;

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: { requester: { select: PROFILE_FIELDS }, addressee: { select: PROFILE_FIELDS } },
    orderBy: { createdAt: "desc" },
  });

  const friends: any[] = [];
  const incoming: any[] = [];
  const outgoing: any[] = [];

  for (const f of friendships) {
    const isRequester = f.requesterId === userId;
    const other = isRequester ? f.addressee : f.requester;
    const row = { friendshipId: f.id, user: { ...other, online: isOnline(other.id) } };
    if (f.status === "accepted") friends.push(row);
    else if (isRequester) outgoing.push(row);
    else incoming.push(row);
  }

  return NextResponse.json({ friends, incoming, outgoing });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const toUserId = typeof body?.toUserId === "string" ? body.toUserId : "";
  if (!toUserId || toUserId === userId) {
    return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: toUserId },
        { requesterId: toUserId, addresseeId: userId },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ error: "A friend request already exists between you two." }, { status: 409 });
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: userId, addresseeId: toUserId, status: "pending" },
  });

  return NextResponse.json({ friendshipId: friendship.id });
}
