import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const config = await prisma.minecraftConfig.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({ online: config?.online ?? false });
}
