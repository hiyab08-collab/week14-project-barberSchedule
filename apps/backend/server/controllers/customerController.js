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
        phone: true,
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

// =========================
// CREATE CUSTOMER
// BARBER / ADMIN USE
// =========================

export async function createCustomer(req, res) {
  try {
    const { name, email, phone } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "Customer name is required",
      });
    }

    const normalizedEmail = email?.trim() ? email.trim().toLowerCase() : null;

    const normalizedPhone = phone?.trim() ? phone.trim() : null;

    if (!normalizedEmail && !normalizedPhone) {
      return res.status(400).json({
        error: "Please provide an email or phone number",
      });
    }

    // =========================
    // CHECK EMAIL DUPLICATE
    // =========================

    if (normalizedEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (existingEmail) {
        return res.status(409).json({
          error: "A customer with this email already exists",
        });
      }
    }

    // =========================
    // CHECK PHONE DUPLICATE
    // =========================

    if (normalizedPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: normalizedPhone,
        },
      });

      if (existingPhone) {
        return res.status(409).json({
          error: "A customer with this phone number already exists",
        });
      }
    }

    // =========================
    // CREATE PHONE CUSTOMER
    // =========================

    const customer = await prisma.user.create({
      data: {
        name: name.trim(),

        email: normalizedEmail,

        phone: normalizedPhone,

        // Phone/walk-in customers
        // do not need an online password.
        password: null,

        role: "CUSTOMER",
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);

    res.status(500).json({
      error: "Failed to create customer",
    });
  }
}
