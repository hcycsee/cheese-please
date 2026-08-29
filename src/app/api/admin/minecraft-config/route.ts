import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

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

  const config = await prisma.minecraftConfig.findUnique({ where: { id: CONFIG_ID } });
  return NextResponse.json({ online: config?.online ?? false });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const online = body?.online === true;

  const config = await prisma.minecraftConfig.upsert({
    where: { id: CONFIG_ID },
    update: { online },
    create: { id: CONFIG_ID, online },
  });

  return NextResponse.json({ online: config.online });
}
