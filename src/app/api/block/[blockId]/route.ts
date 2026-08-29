import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: { blockId: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const block = await prisma.block.findUnique({ where: { id: params.blockId } });
  if (!block || block.blockerId !== userId) {
    return NextResponse.json({ error: "Block not found." }, { status: 404 });
  }

  await prisma.block.delete({ where: { id: block.id } });
  return NextResponse.json({ ok: true });
}
