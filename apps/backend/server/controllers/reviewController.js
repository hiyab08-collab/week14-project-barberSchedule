import prisma from "../db/prisma.js";

export async function getReviews(req, res) {
  try {
    const { barberId, serviceId } = req.query;

    if (!barberId && !serviceId) {
      return res
        .status(400)
        .json({ error: "Provide a barberId or serviceId query param" });
    }

    const reviews = await prisma.review.findMany({
      where: {
        ...(barberId ? { barberId: Number(barberId) } : {}),
        ...(serviceId ? { serviceId: Number(serviceId) } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

export async function createReview(req, res) {
  try {
    const { userId } = req.user;
    const barberId = req.body.barberId ? Number(req.body.barberId) : null;
    const serviceId = req.body.serviceId ? Number(req.body.serviceId) : null;
    const rating = Number(req.body.rating);
    const comment = req.body.comment || null;

    if (!barberId && !serviceId) {
      return res
        .status(400)
        .json({ error: "A review needs either a barberId or a serviceId" });
    }
    if (barberId && serviceId) {
      return res
        .status(400)
        .json({ error: "A review can target a barber OR a service, not both" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    }

    const review = await prisma.review.create({
      data: {
        customerId: userId,
        barberId,
        serviceId,
        rating,
        comment,
        mediaUrl,
        mediaType,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
}
