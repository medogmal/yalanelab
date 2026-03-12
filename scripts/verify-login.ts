import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "sldv.smsm1234@gmail.com";
  const password = "a01013177727";

  console.log(`Verifying user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("User not found in DB!");
    return;
  }

  console.log("User found:", user.id, user.email, user.role);
  console.log("Stored Hash:", user.password);

  if (!user.password) {
    console.log("User has no password set!");
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  console.log(`Password '${password}' matches hash?`, isValid);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
