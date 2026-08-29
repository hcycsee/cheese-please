// Ensures the demo admin account (admin1@admin.com / admin1) exists, so the
// admin-only section always has a way in on a fresh clone or after the local
// dev database is wiped. Idempotent — safe to run on every install.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const ADMIN_EMAIL = "admin1@admin.com";
const ADMIN_PASSWORD = "admin1";

async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      if (!existing.isAdmin) {
        await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
        console.log(`Marked existing ${ADMIN_EMAIL} as admin.`);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        name: "Admin",
        email: ADMIN_EMAIL,
        passwordHash,
        isAdmin: true,
        institution: "unipixel",
        gender: "Prefer not to say",
        faculty: "Other",
        age: 99,
        onboardingStep: 6,
        onboardingComplete: true,
      },
    });
    console.log(`Created admin account: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // Best-effort — never block install/dev over this.
  console.error("ensure-admin: failed to seed admin account:", err.message || err);
});
