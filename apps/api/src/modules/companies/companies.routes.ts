import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const companiesRouter = Router();

companiesRouter.use(requireAuth);

companiesRouter.get("/", async (_req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: [{ location: "asc" }, { name: "asc" }]
    });

    return res.json({ companies });
  } catch (error) {
    return next(error);
  }
});

