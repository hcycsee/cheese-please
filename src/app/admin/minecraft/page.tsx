import AppShell, { requireAdmin } from "@/components/AppShell";
import MinecraftConfigForm from "@/components/MinecraftConfigForm";
import { prisma } from "@/lib/db";
import { displayName } from "@/lib/format";

export default async function AdminMinecraftPage() {
  const user = await requireAdmin();

  const config = await prisma.minecraftConfig.findUnique({
    where: { id: "singleton" },
    include: { targetUser: { select: { id: true, name: true, preferredName: true, email: true } } },
  });

  return (
    <AppShell user={user}>
      <h1 className="mb-1 text-2xl font-bold">Minecraft integration</h1>
      <p className="mb-6 text-stone-600">
        The datapack/bridge on your Minecraft server polls this app to check whether one specific unipixel account
        is currently online — only the server IP set below is allowed to ask.
      </p>
      <MinecraftConfigForm
        initialAllowedIp={config?.allowedIp ?? ""}
        initialTargetEmail={config?.targetUser?.email ?? ""}
        initialTargetName={config?.targetUser ? displayName(config.targetUser) : null}
      />
    </AppShell>
  );
}
