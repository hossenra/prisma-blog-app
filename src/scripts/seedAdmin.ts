import { prisma } from "../lib/prisma";
import { UserRole } from "../middlewares/auth";
import { randomUUID } from "crypto";

async function seedAdmin() {
  try {
    const adminData = {
      name: "Admin3 Saheb",
      email: "admin3@gmail.com",
      role: UserRole.ADMIN,
      emailVerified: true,
      password: "admin1234",
    };

    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email },
    });

    if (existingUser) {
      console.log("✅ Admin already exists:", existingUser.email);
      return;
    }

    const admin = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: adminData.name,
        email: adminData.email,
        role: adminData.role,
        emailVerified: adminData.emailVerified,
      },
    });

    console.log("✅ Seeded admin user:", { id: admin.id, email: admin.email });
  } catch (error) {
    console.error("❌ seedAdmin failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
