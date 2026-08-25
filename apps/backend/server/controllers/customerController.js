import prisma from "../db/prisma.js";

// =========================
// GET CUSTOMERS
// BARBER / ADMIN USE
// =========================

export async function getCustomers(req, res) {
  try {
    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
      },

      select: {
        id: true,
        name: true,
        email: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    res.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);

    res.status(500).json({
      error: "Failed to fetch customers",
    });
  }
}
