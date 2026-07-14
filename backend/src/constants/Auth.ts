import type { CookieOptions } from 'express'

export const AUTH_CONSTANTS = {
  ROLES: {
    ADMIN: 'ADMIN',
    STUDENT: 'STUDENT',
    TUTOR: 'TUTOR',
  },
}

export const REFRESH_TOKEN_EXPIRATION_TIME = '7d'
export const ACCESS_TOKEN_EXPIRATION_TIME = '1d'

// The refresh cookie is read cross-site by the SPA (different origin from the
// API), so it must be sameSite:'none' + secure (HTTPS) to be stored and sent.
// The frontend axios sets withCredentials:true; CORS uses credentials:true with
// an explicit origin allow-list (never '*').
export const REFRESH_COOKIE_NAME = 'refreshToken'
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7d, matches token TTL

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: REFRESH_COOKIE_MAX_AGE,
}
