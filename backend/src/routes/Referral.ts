import { Router } from 'express'
import {
  getReferralController,
  getReferralOverviewController,
} from '../controllers/Referral'
import { requireAuth, requireRole } from '../middleware/auth'

export const ReferralRouter = Router()

ReferralRouter.get('/', requireAuth, requireRole('ADMIN'), getReferralOverviewController)
ReferralRouter.get('/:id', requireAuth, getReferralController)
