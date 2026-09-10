import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/** An error with an attached HTTP status code, thrown from route handlers. */
export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Fallback for unmatched routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

/** Central error handler — the single place that shapes error responses. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Validation errors -> 400 with a readable field breakdown.
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({
        field: i.path.join('.') || '(root)',
        message: i.message,
      })),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  // Anything else is unexpected: log it, don't leak internals to the client.
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
