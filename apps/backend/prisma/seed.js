import "dotenv/config";
import bcrypt from "bcrypt";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  // =========================
  // SERVICES
  // =========================

  const services = [
    {
      name: "Haircut",
      description: "Classic haircut, clippers or scissors",
      price: 25.0,
      durationMinutes: 30,
    },
    {
      name: "Fade",
      description: "Skin fade or taper fade",
      price: 30.0,
      durationMinutes: 45,
    },
    {
      name: "Beard Trim",
      description: "Shape and trim facial hair",
      price: 15.0,
      durationMinutes: 15,
    },
    {
      name: "Haircut + Beard Combo",
      description: "Haircut and beard trim together",
      price: 35.0,
      durationMinutes: 45,
    },
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: {
        name: service.name,
      },
    });

    if (existing) {
      await prisma.service.update({
        where: {
          id: existing.id,
        },
        data: service,
      });
    } else {
      await prisma.service.create({
        data: service,
      });
    }
  }

  // =========================
  // TEST BARBER
  // =========================

  const barberPassword = await bcrypt.hash("test123", 10);

  const existingTony = await prisma.user.findUnique({
    where: {
      email: "tony@example.com",
    },
  });

  if (!existingTony) {
    await prisma.user.create({
      data: {
        name: "Tony Reyes",
        email: "tony@example.com",
        password: barberPassword,
        role: "BARBER",

        barberProfile: {
          create: {
            bio: "10 years experience, specializes in fades",
            specialties: "Fades, Line Ups",
          },
        },
      },
    });
  }

  console.log("Render seed complete: services and barber are ready.");
}

main()
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
