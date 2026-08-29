import Link from "next/link";
import { prisma } from "@/lib/db";
import AppShell, { requireOnboardedUser } from "@/components/AppShell";
import MatchPanel from "@/components/MatchPanel";

export default async function MatchPage() {
  const user = await requireOnboardedUser();

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true },
    orderBy: { joinedAt: "desc" },
    take: 10,
  });

  return (
    <AppShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Find a group</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MatchPanel
          initialPrefs={{
            sameGenderOnly: user.sameGenderOnly,
            ageFactor: user.ageFactor,
            facultyFactor: user.facultyFactor,
            mbtiFactor: user.mbtiFactor,
          }}
        />
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Your recent groups</h2>
          {memberships.length === 0 ? (
            <p className="text-sm text-stone-500">You haven&apos;t been matched into a group yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {memberships.map((m) => (
                <Link key={m.groupId} href={`/chat/group/${m.groupId}`} className="card block hover:bg-stone-50">
                  <p className="font-medium">{m.group.name}</p>
                  <p className="text-xs text-stone-500">{m.group.summary}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
