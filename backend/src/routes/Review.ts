import { Router } from 'express'
import {
  createReviewController,
  deleteReviewController,
  getAllReviewsController,
  getMentorReviewsController,
} from '../controllers/Review'
import { requireAuth, requireRole } from '../middleware/auth'

export const ReviewRouter = Router()

ReviewRouter.get('/', requireAuth, requireRole('ADMIN'), getAllReviewsController)
ReviewRouter.post('/', requireAuth, requireRole('STUDENT'), createReviewController)
ReviewRouter.get('/mentor/:mentorId', getMentorReviewsController) // public
ReviewRouter.delete('/:id', requireAuth, requireRole('ADMIN'), deleteReviewController)
