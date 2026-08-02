import prisma from "../db/prisma.js";

export async function toggleFavoriteBarber(req, res) {
  try {
    const barberId = Number(req.params.id);
    const { userId } = req.user;

    const existing = await prisma.favorite.findUnique({
      where: { userId_barberId: { userId, barberId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({ data: { userId, barberId } });
    }

    res.json({ favorited: !existing });
  } catch (error) {
    console.error("Error toggling favorite barber:", error);
    res.status(500).json({ error: "Failed to toggle favorite" });
  }
}

export async function toggleFavoriteService(req, res) {
  try {
    const serviceId = Number(req.params.id);
    const { userId } = req.user;

    const existing = await prisma.favorite.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
    } else {
      await prisma.favorite.create({ data: { userId, serviceId } });
    }

    res.json({ favorited: !existing });
  } catch (error) {
    console.error("Error toggling favorite service:", error);
    res.status(500).json({ error: "Failed to toggle favorite" });
  }
}

export async function getMyFavorites(req, res) {
  try {
    const { userId } = req.user;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        barber: { select: { id: true, name: true, barberProfile: true } },
        service: true,
      },
    });

    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
}
