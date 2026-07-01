import { Router } from 'express'
import {
  createReviewController,
  getMentorReviewsController,
} from '../controllers/Review'

export const ReviewRouter = Router()

ReviewRouter.post('/', createReviewController)
ReviewRouter.get('/mentor/:mentorId', getMentorReviewsController)
