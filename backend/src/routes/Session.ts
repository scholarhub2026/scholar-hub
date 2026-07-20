import { Router } from 'express'
import {
  createSessionController,
  deleteSessionController,
  listSessionsController,
  rejectSessionController,
  updateSessionController,
  verifySessionController,
} from '../controllers/Session'
import { requireAuth, requireRole } from '../middleware/auth'

export const SessionRouter = Router()

// Mentor logs completed class sessions; admin verifies them into billing.
SessionRouter.post('/', requireAuth, requireRole('TUTOR'), createSessionController)
SessionRouter.get('/', requireAuth, listSessionsController) // controller role-filters
SessionRouter.patch('/:sessionId/verify', requireAuth, requireRole('ADMIN'), verifySessionController)
SessionRouter.patch('/:sessionId/reject', requireAuth, requireRole('ADMIN'), rejectSessionController)
SessionRouter.patch('/:sessionId', requireAuth, requireRole('TUTOR'), updateSessionController)
SessionRouter.delete('/:sessionId', requireAuth, requireRole('TUTOR', 'ADMIN'), deleteSessionController)
