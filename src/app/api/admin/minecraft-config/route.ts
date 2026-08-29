import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { displayName } from "@/lib/format";

const CONFIG_ID = "singleton";

async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) } as const;
  if (!user.isAdmin) return { error: NextResponse.json({ error: "Admin only." }, { status: 403 }) } as const;
  return { user } as const;
}

export async function GET() {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const config = await prisma.minecraftConfig.findUnique({
    where: { id: CONFIG_ID },
    include: { targetUser: { select: { id: true, name: true, preferredName: true, email: true } } },
  });

  return NextResponse.json({
    allowedIp: config?.allowedIp ?? null,
    targetUser: config?.targetUser ? { id: config.targetUser.id, name: displayName(config.targetUser), email: config.targetUser.email } : null,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const allowedIp = typeof body?.allowedIp === "string" ? body.allowedIp.trim() : "";
  const targetEmail = typeof body?.targetEmail === "string" ? body.targetEmail.trim().toLowerCase() : "";

  let targetUserId: string | null = null;
  if (targetEmail) {
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (!targetUser) {
      return NextResponse.json({ error: "No account with that email." }, { status: 404 });
    }
    targetUserId = targetUser.id;
  }

  const config = await prisma.minecraftConfig.upsert({
    where: { id: CONFIG_ID },
    update: { allowedIp: allowedIp || null, targetUserId },
    create: { id: CONFIG_ID, allowedIp: allowedIp || null, targetUserId },
    include: { targetUser: { select: { id: true, name: true, preferredName: true, email: true } } },
  });

  return NextResponse.json({
    allowedIp: config.allowedIp,
    targetUser: config.targetUser ? { id: config.targetUser.id, name: displayName(config.targetUser), email: config.targetUser.email } : null,
  });
}
