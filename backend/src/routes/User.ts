import { Router } from 'express'
import {
  createUserController,
  getUsersController,
  setUserStatusController,
} from '../controllers/User'
import { requireAuth, requireRole } from '../middleware/auth'

export const UserRouter = Router()

UserRouter.get('/', requireAuth, requireRole('ADMIN'), getUsersController)
UserRouter.post('/', requireAuth, requireRole('ADMIN'), createUserController)
UserRouter.put('/:id/status', requireAuth, requireRole('ADMIN'), setUserStatusController)
