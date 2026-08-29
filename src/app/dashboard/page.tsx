import { prisma } from "@/lib/db";
import AppShell, { requireOnboardedUser } from "@/components/AppShell";
import OnlineDirectory, { type DirectoryUser } from "@/components/OnlineDirectory";
import { visibleChips } from "@/lib/format";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();

  const [others, friendships] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: user.id }, onboardingComplete: true },
      select: {
        id: true,
        name: true,
        preferredName: true,
        avatarUrl: true,
        gender: true,
        age: true,
        faculty: true,
        mbti: true,
        showGender: true,
        showAge: true,
        showFaculty: true,
        showMbti: true,
        ownedGames: true,
        steamGames: true,
      },
      orderBy: { lastSeenAt: "desc" },
      take: 100,
    }),
    prisma.friendship.findMany({
      where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }] },
    }),
  ]);

  const statusByUserId = new Map<string, { status: DirectoryUser["friendStatus"]; friendshipId: string }>();
  for (const f of friendships) {
    const otherId = f.requesterId === user.id ? f.addresseeId : f.requesterId;
    const status: DirectoryUser["friendStatus"] =
      f.status === "accepted" ? "friends" : f.requesterId === user.id ? "pending_out" : "pending_in";
    statusByUserId.set(otherId, { status, friendshipId: f.id });
  }

  const directoryUsers: DirectoryUser[] = others.map(
    ({ gender, age, faculty, mbti, showGender, showAge, showFaculty, showMbti, ...u }) => ({
      ...u,
      ...visibleChips({ gender, age, faculty, mbti, showGender, showAge, showFaculty, showMbti }),
      friendStatus: statusByUserId.get(u.id)?.status ?? "none",
      friendshipId: statusByUserId.get(u.id)?.friendshipId,
    })
  );

  return (
    <AppShell user={user}>
      <h1 className="mb-1 text-2xl font-bold">Who&apos;s around</h1>
      <p className="mb-6 text-stone-600">Everyone currently online is shown first.</p>
      <OnlineDirectory initialUsers={directoryUsers} />
    </AppShell>
  );
}
