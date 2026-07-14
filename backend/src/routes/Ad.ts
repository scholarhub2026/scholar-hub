import { Router } from 'express'
import {
  createAdController,
  deleteAdController,
  getActiveAdsController,
  getAllAdsController,
  updateAdController,
} from '../controllers/Ad'
import { requireAuth, requireRole } from '../middleware/auth'

export const AdRouter = Router()

AdRouter.get('/', getActiveAdsController) // public: active ads carousel
AdRouter.get('/all', requireAuth, requireRole('ADMIN'), getAllAdsController)
AdRouter.post('/', requireAuth, requireRole('ADMIN'), createAdController)
AdRouter.put('/:id', requireAuth, requireRole('ADMIN'), updateAdController)
AdRouter.delete('/:id', requireAuth, requireRole('ADMIN'), deleteAdController)
