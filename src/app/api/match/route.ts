import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { getCurrentDayPeriod, parseJsonArray, PERIODS } from "@/lib/constants";
import { pickGroupMembers, summarizeSharedAttributes, GROUP_TARGET_SIZE } from "@/lib/matching";
import { listOnlineUserIds } from "@/lib/presence";
import { getIo } from "@/lib/socketServer";

const DAY_NAMES: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

const RECENT_GROUP_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const requester = await prisma.user.findUnique({ where: { id: userId } });
  if (!requester || !requester.onboardingComplete) {
    return NextResponse.json({ error: "Finish setting up your profile first." }, { status: 400 });
  }

  const { day, period, slot } = getCurrentDayPeriod();

  // If the requester already has a fresh group for this slot, just send them back to it.
  const recent = await prisma.groupMember.findFirst({
    where: {
      userId,
      group: { dayPeriod: slot, createdAt: { gte: new Date(Date.now() - RECENT_GROUP_WINDOW_MS) } },
    },
    orderBy: { joinedAt: "desc" },
  });
  if (recent) {
    return NextResponse.json({ groupId: recent.groupId, reused: true });
  }

  const onlineIds = listOnlineUserIds().filter((id) => id !== userId);
  if (onlineIds.length === 0) {
    return NextResponse.json({ groupId: null, message: "No one else is online right now — try again soon." });
  }

  const onlineCandidates = await prisma.user.findMany({
    where: { id: { in: onlineIds }, onboardingComplete: true },
  });
  if (onlineCandidates.length === 0) {
    return NextResponse.json({ groupId: null, message: "No one else is online right now — try again soon." });
  }

  // Being online and clicking this button is itself proof of being free right
  // now — we don't require the exact real-world slot to also be pre-declared
  // in their availability grid, we just use it as a tie-breaker bonus.
  const selected = pickGroupMembers(requester, onlineCandidates, GROUP_TARGET_SIZE, (c) =>
    parseJsonArray(c.availability).includes(slot) ? 1 : 0
  );
  if (selected.length === 0) {
    return NextResponse.json({
      groupId: null,
      message: "No one matching your preferences is free right now — try loosening your match filters.",
    });
  }

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? period;
  const name = `${DAY_NAMES[day]} ${periodLabel} Group`;
  const summary = summarizeSharedAttributes(requester, selected);

  const group = await prisma.matchGroup.create({
    data: {
      name,
      dayPeriod: slot,
      summary,
      members: {
        create: [
          { userId: requester.id, score: selected.length ? Math.round(selected.reduce((s, m) => s + m.score, 0) / selected.length) : 0 },
          ...selected.map((m) => ({ userId: m.user.id, score: m.score })),
        ],
      },
    },
  });

  const io = getIo();
  if (io) {
    const memberIds = [requester.id, ...selected.map((m) => m.user.id)];
    for (const uid of memberIds) {
      io.in(`user:${uid}`).socketsJoin(`group:${group.id}`);
    }
    io.to(`group:${group.id}`).emit("match:joined", { groupId: group.id, name, summary });
  }

  return NextResponse.json({ groupId: group.id, memberCount: selected.length + 1, summary });
}
