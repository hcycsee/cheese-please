import AppShell, { requireOnboardedUser } from "@/components/AppShell";
import ProfileEditor from "@/components/ProfileEditor";

export default async function ProfilePage() {
  const user = await requireOnboardedUser();

  return (
    <AppShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Your profile</h1>
      <ProfileEditor
        initial={{
          preferredName: user.preferredName,
          institution: user.institution,
          gender: user.gender,
          faculty: user.faculty,
          age: user.age,
          mbti: user.mbti,
          availability: user.availability,
          ownedGames: user.ownedGames,
          steamId64: user.steamId64,
          steamProfileUrl: user.steamProfileUrl,
          steamGames: user.steamGames,
          steamSyncedAt: user.steamSyncedAt ? user.steamSyncedAt.toISOString() : null,
        }}
      />
    </AppShell>
  );
}
