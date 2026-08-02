import bcrypt from "bcrypt";
import prisma from "../db/prisma.js";

export async function getAllBarbers(req, res) {
  try {
    const barbers = await prisma.user.findMany({
      where: { role: "BARBER" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        barberProfile: true,
        _count: { select: { likesReceived: true } },
      },
    });
    res.json(barbers);
  } catch (error) {
    console.error("Error fetching barbers:", error);
    res.status(500).json({ error: "Failed to fetch barbers" });
  }
}

export async function toggleLike(req, res) {
  try {
    const barberId = Number(req.params.id);
    const { userId } = req.user;

    const existingLike = await prisma.barberLike.findUnique({
      where: { userId_barberId: { userId, barberId } },
    });

    if (existingLike) {
      await prisma.barberLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.barberLike.create({ data: { userId, barberId } });
    }

    const likeCount = await prisma.barberLike.count({ where: { barberId } });

    res.json({ liked: !existingLike, likeCount });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
}

export async function getBarberById(req, res) {
  try {
    const barberId = Number(req.params.id);

    const barber = await prisma.user.findUnique({
      where: { id: barberId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        barberProfile: true,
        _count: { select: { likesReceived: true } },
      },
    });

    if (!barber || barber.role !== "BARBER") {
      return res.status(404).json({ error: "Barber not found" });
    }

    res.json(barber);
  } catch (error) {
    console.error("Error fetching barber:", error);
    res.status(500).json({ error: "Failed to fetch barber" });
  }
}

export async function createBarber(req, res) {
  try {
    const { name, email, password, bio, specialties } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const barber = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "BARBER",
        barberProfile: {
          create: { bio: bio || null, specialties: specialties || null },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        barberProfile: true,
      },
    });

    res.status(201).json(barber);
  } catch (error) {
    console.error("Error creating barber:", error);
    res.status(500).json({ error: "Failed to create barber" });
  }
}

export async function updateBarber(req, res) {
  try {
    const barberId = Number(req.params.id);
    const { name, bio, specialties } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: barberId } });
    if (!existing || existing.role !== "BARBER") {
      return res.status(404).json({ error: "Barber not found" });
    }

    const updated = await prisma.user.update({
      where: { id: barberId },
      data: {
        name,
        barberProfile: {
          update: { bio, specialties },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        barberProfile: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating barber:", error);
    res.status(500).json({ error: "Failed to update barber" });
  }
}

export async function deleteBarber(req, res) {
  try {
    const barberId = Number(req.params.id);

    const existing = await prisma.user.findUnique({ where: { id: barberId } });
    if (!existing || existing.role !== "BARBER") {
      return res.status(404).json({ error: "Barber not found" });
    }

    await prisma.barberProfile.deleteMany({ where: { userId: barberId } });
    await prisma.user.delete({ where: { id: barberId } });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting barber:", error);
    res
      .status(409)
      .json({ error: "Cannot delete a barber that has existing appointments" });
  }
}
