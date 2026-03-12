import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@yalanelab.com";
  const password = "Admin@Yalla2026";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Creating/Updating admin user: ${email}`);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "super_admin",
      name: "Super Admin",
    },
    create: {
      email,
      name: "Super Admin",
      password: hashedPassword,
      role: "super_admin",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=YallaAdmin",
    },
  });

  console.log("\n✅ Admin created!\n");
  console.log("Email    :", email);
  console.log("Password :", password);
  console.log("Login    : http://localhost:3000/auth/login");
  console.log("Admin    : http://localhost:3000/admin\n");

  // Also ensure profile exists
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      vip: true,
      coins: 999999,
      gems: 999999,
    },
    create: {
      userId: user.id,
      vip: true,
      coins: 999999,
      gems: 999999,
    },
  });
  
  console.log("Admin profile updated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
