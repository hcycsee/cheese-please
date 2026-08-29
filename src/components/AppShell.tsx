import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import Navbar from "./Navbar";
import NotificationToasts from "./NotificationToasts";

export async function requireOnboardedUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboardingComplete) redirect("/register");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");
  return user;
}

export default function AppShell({
  user,
  children,
}: {
  user: { id: string; name: string; preferredName?: string | null; avatarUrl?: string | null; isAdmin?: boolean };
  children: React.ReactNode;
}) {
  // Only pass the fields Navbar actually needs into the client bundle — the
  // caller's `user` may be a full Prisma record (passwordHash and all), and
  // TS's structural typing won't stop that from serializing to the browser.
  const safeUser = {
    name: user.name,
    preferredName: user.preferredName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    isAdmin: user.isAdmin ?? false,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar user={safeUser} />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <NotificationToasts currentUserId={user.id} />
    </div>
  );
}
