import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";

// =========================
// SIGN UP
// PUBLIC CUSTOMER SIGNUP
// =========================

export async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,

        // Public signup can only
        // create customer accounts.
        role: "CUSTOMER",
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Error signing up:", error);

    res.status(500).json({
      error: "Failed to sign up",
    });
  }
}

// =========================
// LOGIN
// =========================

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // A customer created by a barber
    // over the phone may not have a
    // website password yet.
    if (!user.password) {
      return res.status(401).json({
        error: "This customer does not have an online login yet",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Error logging in:", error);

    res.status(500).json({
      error: "Failed to log in",
    });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { barberProfile: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });
    const normalizedEmail = email?.trim().toLowerCase();
    const changingEmail = normalizedEmail && normalizedEmail !== user.email;
    const changingPassword = Boolean(newPassword);

    if (changingEmail || changingPassword) {
      if (!user.password || !currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }

    if (changingEmail) {
      const duplicate = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (duplicate) return res.status(409).json({ error: "An account with this email already exists" });
    }

    if (newPassword && newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name?.trim() || user.name,
        email: normalizedEmail || user.email,
        phone: phone?.trim() || null,
        ...(newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
        ...(user.role === "BARBER" && (req.body.bio !== undefined || req.body.specialties !== undefined)
          ? { barberProfile: { update: { bio: req.body.bio?.trim() || null, specialties: req.body.specialties?.trim() || null } } }
          : {}),
      },
      include: { barberProfile: true },
    });
    const { password: _, ...safeUser } = updated;
    return res.json(safeUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.code === "P2002") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    return res.status(500).json({ error: "Failed to update profile" });
  }
}
