import Router from 'express'
import {
  createClasses,
  deleteClasses,
  getClasses,
  updateClasses,
} from '../controllers/Classes'
import { requireAuth, requireRole } from '../middleware/auth'

export const classRouter = Router()

classRouter.get('/', getClasses) // public: used by browse/booking
classRouter.post('/', requireAuth, requireRole('ADMIN'), createClasses)
classRouter.put('/:id', requireAuth, requireRole('ADMIN'), updateClasses)
classRouter.delete('/:id', requireAuth, requireRole('ADMIN'), deleteClasses)
