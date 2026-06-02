import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (msg = "Not found") => new ApiError(404, msg);
export const badRequest = (msg: string, details?: unknown) =>
  new ApiError(400, msg, details);
export const conflict = (msg: string) => new ApiError(409, msg);

// Wraps async/sync handlers so thrown errors reach the error middleware.
export function handler(
  fn: (req: Request, res: Response) => unknown | Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: { message: "Validation failed", details: err.flatten() } });
  }
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { message: err.message, details: err.details } });
  }
  console.error(err);
  return res.status(500).json({ error: { message: "Internal server error" } });
}
