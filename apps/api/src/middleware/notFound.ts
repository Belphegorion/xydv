import type { Request, Response } from 'express';

export function notFound(req: Request, res: Response): void {
  const message = `Route ${req.originalUrl} not found`;
  res.status(404).json({
    success: false,
    error: message,
    message,
  });
}
