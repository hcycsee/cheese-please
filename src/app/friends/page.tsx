import AppShell, { requireOnboardedUser } from "@/components/AppShell";
import FriendsPanel from "@/components/FriendsPanel";

export default async function FriendsPage() {
  const user = await requireOnboardedUser();
  return (
    <AppShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Friends</h1>
      <FriendsPanel />
    </AppShell>
  );
}
