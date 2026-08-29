import Link from "next/link";
import AppShell, { requireAdmin } from "@/components/AppShell";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const user = await requireAdmin();

  const [userCount, onboardedCount, messageCount, groupCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardingComplete: true } }),
    prisma.message.count(),
    prisma.matchGroup.count(),
  ]);

  const stats = [
    { label: "Total accounts", value: userCount },
    { label: "Onboarded", value: onboardedCount },
    { label: "Messages sent", value: messageCount },
    { label: "Groups formed", value: groupCount },
  ];

  return (
    <AppShell user={user}>
      <h1 className="mb-1 text-2xl font-bold">Admin</h1>
      <p className="mb-6 text-stone-600">Signed in as {user.email}.</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Link href="/admin/minecraft" className="card mt-6 block hover:bg-stone-100">
        <p className="font-semibold">🟩 Minecraft integration</p>
        <p className="text-sm text-stone-500">Configure which account's online status the datapack relays.</p>
      </Link>
    </AppShell>
  );
}
