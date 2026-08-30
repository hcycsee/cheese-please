import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AppShell, { requireOnboardedUser } from "@/components/AppShell";
import ChatWindow from "@/components/ChatWindow";
import { displayName } from "@/lib/format";

export default async function GroupChatPage({ params }: { params: { groupId: string } }) {
  const user = await requireOnboardedUser();

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId: params.groupId } },
  });
  if (!membership) notFound();

  const group = await prisma.matchGroup.findUnique({
    where: { id: params.groupId },
    include: { members: { include: { user: { select: { id: true, name: true, preferredName: true } } } } },
  });
  if (!group) notFound();

  const messages = await prisma.message.findMany({
    where: { groupId: params.groupId },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true, preferredName: true } } },
  });

  const memberNames = group.members
    .map((m) => m.user.preferredName || m.user.name)
    .join(", ");

  const otherMembers = group.members
    .filter((m) => m.user.id !== user.id)
    .map((m) => ({ id: m.user.id, name: displayName(m.user) }));

  return (
    <AppShell user={user}>
      <ChatWindow
        mode="group"
        targetId={group.id}
        currentUserId={user.id}
        title={group.name}
        subtitle={`${group.summary ?? ""} · ${group.members.length} members: ${memberNames}`}
        otherMembers={otherMembers}
        initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      />
    </AppShell>
  );
}
