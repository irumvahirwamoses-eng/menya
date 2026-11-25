import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import mongoose from 'mongoose'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Endpoint not found.' })
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message })
    return
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Please check the information you provided.',
      details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    })
    return
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: error.message })
    return
  }

  if ((error as { code?: number }).code === 11000) {
    res.status(409).json({ error: 'A record with these details already exists.' })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Something went wrong. Please try again.' })
}
