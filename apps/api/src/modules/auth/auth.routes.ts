import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { signAuthToken } from "../../lib/jwt.js";
import { requireAuth } from "../../middleware/auth.js";
import { loginSchema, registerSchema } from "../../validation/schemas.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        city: true
      }
    });

    const token = signAuthToken({ userId: user.id, email: user.email });
    return res.status(201).json({ token, user });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signAuthToken({ userId: user.id, email: user.email });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        city: true
      }
    });

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

