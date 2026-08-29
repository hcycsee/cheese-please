import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export async function getCurrentUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  return session?.userId ?? null;
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
