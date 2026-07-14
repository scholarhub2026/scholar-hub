// utils/catchAsync.ts
import type { Request, Response, NextFunction } from 'express'

export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error: any) => {
      console.error(error)

      // Duplicate unique-key (e.g. email/phone already exists) — return a
      // human-readable message instead of Mongo's raw "E11000 …" string.
      if (error?.code === 11000) {
        const field = Object.keys(error.keyValue || error.keyPattern || {})[0]
        const label =
          field === 'email'
            ? 'email address'
            : field === 'phoneNumber'
              ? 'phone number'
              : field || 'value'
        return res.status(409).json({
          error: 'Duplicate entry',
          message: `This ${label} is already registered.`,
        })
      }

      res.status(400).json({
        error: 'Your request could not be processed. Please try again.',
        message: error.message,
      })
    })
  }
}
