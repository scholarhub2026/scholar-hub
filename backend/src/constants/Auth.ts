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

export const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
}
