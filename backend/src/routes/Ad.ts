import { Router } from 'express'
import {
  createAdController,
  deleteAdController,
  getActiveAdsController,
  getAllAdsController,
  updateAdController,
} from '../controllers/Ad'

export const AdRouter = Router()

AdRouter.get('/', getActiveAdsController)
AdRouter.get('/all', getAllAdsController)
AdRouter.post('/', createAdController)
AdRouter.put('/:id', updateAdController)
AdRouter.delete('/:id', deleteAdController)
