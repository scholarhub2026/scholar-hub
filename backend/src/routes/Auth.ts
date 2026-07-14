import { Router } from 'express'
import {

  refreshAccessTokenController,
  refreshTokenController,
  registerFcmTokenController,
  removeFcmTokenController,
  signInController,
  signupController,
  updateUserController,
  verifyEmailOTPController,
} from '../controllers/Auth'
import { requireAuth } from '../middleware/auth'

export const AuthRouter = Router()

// Public auth flows
AuthRouter.post('/signin', signupController)
AuthRouter.post('/login', signInController)
AuthRouter.get('/verify-token', refreshTokenController)
AuthRouter.post('/refresh', refreshAccessTokenController)
AuthRouter.post('/verify/:id', verifyEmailOTPController)

// Authenticated account actions
AuthRouter.put('/fcm-token/:id', requireAuth, registerFcmTokenController)
AuthRouter.delete('/fcm-token/:id', requireAuth, removeFcmTokenController)
AuthRouter.put('/:id', requireAuth, updateUserController)



