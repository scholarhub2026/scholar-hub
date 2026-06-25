// utils/catchAsync.ts
import type { Request, Response, NextFunction } from 'express'

export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error) => {
      console.error(error)
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.',
        message:error.message
      })
    })
  }
}
