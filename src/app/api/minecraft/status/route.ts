import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId query param is required." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { minecraftOnline: true } });
  if (!user) return NextResponse.json({ error: "No account with that id." }, { status: 404 });

  return NextResponse.json({ online: user.minecraftOnline });
}
