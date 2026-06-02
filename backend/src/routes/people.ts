import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { handler } from "../errors.js";
import { getEditor, getReporter, listEditors, listReporters } from "../repo.js";
import { AVAILABILITY } from "../types.js";

export const reportersRouter = Router();
export const editorsRouter = Router();

const createReporterSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  availability: z.enum(AVAILABILITY).optional(),
});

reportersRouter.get(
  "/",
  handler((_req, res) => res.json(listReporters()))
);

reportersRouter.post(
  "/",
  handler((req, res) => {
    const { name, city, availability } = createReporterSchema.parse(req.body);
    const result = db
      .prepare("INSERT INTO reporters (name, city, availability) VALUES (?, ?, ?)")
      .run(name, city, availability ?? "available");
    res.status(201).json(getReporter(Number(result.lastInsertRowid)));
  })
);

const createEditorSchema = z.object({
  name: z.string().min(1),
  flat_fee: z.number().int().nonnegative().optional(),
});

editorsRouter.get(
  "/",
  handler((_req, res) => res.json(listEditors()))
);

editorsRouter.post(
  "/",
  handler((req, res) => {
    const { name, flat_fee } = createEditorSchema.parse(req.body);
    const result = db
      .prepare("INSERT INTO editors (name, flat_fee) VALUES (?, ?)")
      .run(name, flat_fee ?? 50000);
    res.status(201).json(getEditor(Number(result.lastInsertRowid)));
  })
);
