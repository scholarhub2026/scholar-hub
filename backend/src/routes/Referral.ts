import { Router } from 'express'
import { getReferralController } from '../controllers/Referral'

export const ReferralRouter = Router()

ReferralRouter.get('/:id', getReferralController)
