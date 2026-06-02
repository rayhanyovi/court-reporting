import express from "express";
import cors from "cors";
import { errorHandler, handler } from "./errors.js";
import { jobsRouter } from "./routes/jobs.js";
import { editorsRouter, reportersRouter } from "./routes/people.js";
import { computeStats } from "./repo.js";

// Tiny request logger — method, path, status, and duration.
function requestLogger(): express.RequestHandler {
  return (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`
      );
    });
    next();
  };
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  if (process.env.NODE_ENV !== "test") app.use(requestLogger());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.get(
    "/api/stats",
    handler((_req, res) => res.json(computeStats()))
  );
  app.use("/api/jobs", jobsRouter);
  app.use("/api/reporters", reportersRouter);
  app.use("/api/editors", editorsRouter);

  app.use(errorHandler);
  return app;
}
