import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { taskCreateSchema, taskUpdateSchema } from "../../validation/schemas.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.post("/applications/:applicationId/tasks", async (req, res, next) => {
  try {
    const input = taskCreateSchema.parse(req.body);
    const application = await prisma.application.findFirst({
      where: {
        id: req.params.applicationId,
        userId: req.user!.userId
      }
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const task = await prisma.task.create({
      data: {
        title: input.title,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        applicationId: application.id
      }
    });

    return res.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.patch("/tasks/:taskId", async (req, res, next) => {
  try {
    const input = taskUpdateSchema.parse(req.body);
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.taskId,
        application: {
          userId: req.user!.userId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = await prisma.task.update({
      where: { id: existing.id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.dueDate !== undefined
          ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
          : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {})
      }
    });

    return res.json({ task });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.delete("/tasks/:taskId", async (req, res, next) => {
  try {
    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.taskId,
        application: {
          userId: req.user!.userId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }

    await prisma.task.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

