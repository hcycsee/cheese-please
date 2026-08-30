import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AppShell, { requireOnboardedUser } from "@/components/AppShell";
import ChatWindow from "@/components/ChatWindow";
import { displayName } from "@/lib/format";

export default async function DirectChatPage({ params }: { params: { friendId: string } }) {
  const user = await requireOnboardedUser();

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: user.id, addresseeId: params.friendId },
        { requesterId: params.friendId, addresseeId: user.id },
      ],
    },
  });
  if (!friendship) notFound();

  const friend = await prisma.user.findUnique({ where: { id: params.friendId } });
  if (!friend) notFound();

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: params.friendId },
        { senderId: params.friendId, receiverId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return (
    <AppShell user={user}>
      <ChatWindow
        mode="dm"
        targetId={friend.id}
        currentUserId={user.id}
        title={displayName(friend)}
        otherMembers={[{ id: friend.id, name: displayName(friend) }]}
        initialMessages={messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
      />
    </AppShell>
  );
}
