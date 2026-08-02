import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.barberProfile.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  await prisma.service.createMany({
    data: [
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
    ],
  });

  const maria = await prisma.user.create({
    data: {
      name: "Maria Lopez",
      email: "maria@example.com",
      password: "placeholder",
      role: "CUSTOMER",
    },
  });

  const tony = await prisma.user.create({
    data: {
      name: "Tony Reyes",
      email: "tony@example.com",
      password: "placeholder",
      role: "BARBER",
      barberProfile: {
        create: {
          bio: "10 years experience, specializes in fades",
          specialties: "Fades, Line Ups",
        },
      },
    },
  });

  console.log("Seed data created:", { maria: maria.id, tony: tony.id });
}

main()
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
