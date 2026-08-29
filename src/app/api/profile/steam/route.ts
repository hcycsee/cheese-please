import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";
import { resolveSteamId64, fetchOwnedGames, SteamError } from "@/lib/steam";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Steam integration isn't configured on this server yet. Add STEAM_API_KEY to .env." },
      { status: 501 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const input = typeof body?.input === "string" ? body.input.trim() : "";
  if (!input) return NextResponse.json({ error: "Enter your Steam profile URL, ID, or SteamID64." }, { status: 400 });

  try {
    const steamId64 = await resolveSteamId64(input, apiKey);
    const games = await fetchOwnedGames(steamId64, apiKey);

    await prisma.user.update({
      where: { id: userId },
      data: {
        steamId64,
        steamProfileUrl: `https://steamcommunity.com/profiles/${steamId64}`,
        steamGames: JSON.stringify(games),
        steamSyncedAt: new Date(),
      },
    });

    return NextResponse.json({ steamId64, games });
  } catch (err) {
    const message = err instanceof SteamError ? err.message : "Failed to sync your Steam library.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  await prisma.user.update({
    where: { id: userId },
    data: { steamId64: null, steamProfileUrl: null, steamGames: null, steamSyncedAt: null },
  });
  return NextResponse.json({ ok: true });
}
