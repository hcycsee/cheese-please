import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

const MAX_GAMES = 100;
const MAX_NAME_LENGTH = 100;

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawGames: unknown[] = Array.isArray(body?.games) ? body.games : [];
  const cleaned = rawGames
    .filter((g): g is string => typeof g === "string" && g.trim().length > 0)
    .map((g) => g.trim().slice(0, MAX_NAME_LENGTH));
  const games: string[] = Array.from(new Set(cleaned)).slice(0, MAX_GAMES);

  await prisma.user.update({ where: { id: userId }, data: { ownedGames: JSON.stringify(games) } });
  return NextResponse.json({ games });
}
