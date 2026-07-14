import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { decodeToken } from '../helpers/Auth'
import AuthModal from '../models/Auth'

/**
 * The authenticated user we attach to the request. The access token only
 * carries `_id` (see iTOKEN_PAYLOAD), so `requireAuth` loads the user to learn
 * their role — that role is what `requireRole` gates on.
 */
export type AuthUser = {
  _id: string
  role?: string
  email?: string
  firstName?: string
  lastName?: string
  isActive?: boolean
}

export type AuthedRequest = Request & { user?: AuthUser }

/**
 * Staged rollout switch.
 *
 * When `AUTH_ENFORCED` is not 'true' (the default), the guards still decode the
 * token and attach `req.user` when present, but they NEVER block a request.
 * This lets us wire `requireAuth` / `requireRole` onto every route now without
 * risking the live mobile app, which may not yet send an Authorization header
 * on all calls. Flip `AUTH_ENFORCED=true` in the backend env once every client
 * is confirmed to send the token, and enforcement turns on with no code change.
 */
const isEnforced = (): boolean => process.env.AUTH_ENFORCED === 'true'

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) return header.split(' ')[1] || null
  return null
}

/** Decode the bearer token (if any) and attach the user. Never throws/blocks. */
const resolveUser = async (req: AuthedRequest): Promise<void> => {
  if (req.user) return
  const token = extractToken(req)
  if (!token) return
  try {
    const decoded = decodeToken(token)
    if (!decoded || !decoded._id) return
    const user = await AuthModal.findById(decoded._id)
      .select('role email firstName lastName isActive')
      .lean()
    if (user) {
      req.user = {
        _id: String(user._id),
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      }
    }
  } catch {
    // Invalid/expired token — leave req.user unset; requireAuth decides.
  }
}

/** Attach the user when a valid token is present, without ever blocking. */
export const attachUser: RequestHandler = async (req, res, next) => {
  await resolveUser(req as AuthedRequest)
  next()
}

/** Require a valid session. Blocks with 401 only when enforcement is on. */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const r = req as AuthedRequest
  await resolveUser(r)
  if (!r.user) {
    if (isEnforced()) return res.status(401).json({ message: 'Unauthorized' })
    return next()
  }
  if (r.user.isActive === false) {
    if (isEnforced()) return res.status(403).json({ message: 'Account disabled' })
    return next()
  }
  next()
}

/** Require one of the given roles. Blocks with 401/403 only when enforcement is on. */
export const requireRole = (...roles: string[]): RequestHandler => {
  return async (req, res, next) => {
    const r = req as AuthedRequest
    await resolveUser(r)
    if (!r.user) {
      if (isEnforced()) return res.status(401).json({ message: 'Unauthorized' })
      return next()
    }
    if (!r.user.role || !roles.includes(r.user.role)) {
      if (isEnforced()) return res.status(403).json({ message: 'Forbidden' })
      return next()
    }
    next()
  }
}
