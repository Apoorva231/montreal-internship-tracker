import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { applicationsRouter } from "./modules/applications/applications.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { companiesRouter } from "./modules/companies/companies.routes.js";
import { tasksRouter } from "./modules/tasks/tasks.routes.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  return res.json({ status: "ok", service: "montreal-internship-tracker-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/applications", applicationsRouter);
app.use("/api", tasksRouter);
app.use("/api/companies", companiesRouter);

if (env.NODE_ENV === "production") {
  const webDistPath = path.resolve(process.cwd(), "../web/dist");
  app.use(express.static(webDistPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Route not found" });
    }

    return res.sendFile(path.join(webDistPath, "index.html"), next);
  });
}

app.use(errorHandler);
