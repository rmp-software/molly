import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  // Idempotent upsert of admin user. Update passwordHash too so re-running the
  // seed with a new ADMIN_PASSWORD actually rotates the stored password
  // (there is no in-app password change to clobber).
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
    },
  });

  console.log(`User upserted (password set): ${email}`);

  // Idempotent create of Dog "Molly" — create only if no dogs exist
  const dogCount = await prisma.dog.count();
  if (dogCount === 0) {
    await prisma.dog.create({
      data: {
        name: "Molly",
        breed: "Golden retriever",
        diagnosis: "Epilepsia idiopática",
      },
    });
    console.log("Dog created: Molly");
  } else {
    console.log("Dog already exists — skipping");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
