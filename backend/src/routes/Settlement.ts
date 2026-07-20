import { Router } from 'express'
import {
  createSettlementController,
  listSettlementsController,
  mentorSettlementsController,
  voidSettlementController,
} from '../controllers/Settlement'
import { voidPaymentController } from '../controllers/Invoice'
import { requireAuth, requireRole } from '../middleware/auth'

export const SettlementRouter = Router()

SettlementRouter.get('/', requireAuth, requireRole('ADMIN'), listSettlementsController)
SettlementRouter.get('/mentor', requireAuth, requireRole('TUTOR'), mentorSettlementsController)
SettlementRouter.post('/', requireAuth, requireRole('ADMIN'), createSettlementController)
SettlementRouter.post('/:settlementId/void', requireAuth, requireRole('ADMIN'), voidSettlementController)

/** Payment corrections live beside settlements (admin-only money ops). */
export const PaymentRouter = Router()
PaymentRouter.post('/:paymentId/void', requireAuth, requireRole('ADMIN'), voidPaymentController)
