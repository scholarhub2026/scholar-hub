import { Router } from 'express'
import {
 
  refreshTokenController,
  signInController,
  signupController,
  updateUserController,
  verifyEmailOTPController,
} from '../controllers/Auth'

export const AuthRouter = Router()

AuthRouter.post('/signin', signupController)

AuthRouter.post('/login', signInController)
AuthRouter.get('/verify-token', refreshTokenController)
AuthRouter.post('/verify/:id', verifyEmailOTPController)
AuthRouter.put('/:id', updateUserController)



