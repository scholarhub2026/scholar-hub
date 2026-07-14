import bcryptjs from 'bcryptjs'
import { iTOKEN_PAYLOAD } from '../types/Auth'
import jwt from 'jsonwebtoken'
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRATION_TIME,
} from '../constants/Auth'

export const encryptPassword = async (password: string) => {
 

  const salt = await bcryptjs.genSalt(10)
  return await bcryptjs.hash(password, salt)
}

export const comparePassword = (password: string, hash: string) => {
  return bcryptjs.compare(password, hash)
}

export const generateAccessToken = (payload: iTOKEN_PAYLOAD): string => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXPIRATION_TIME,
  })
}

export const generateRefreshToken = (payload: iTOKEN_PAYLOAD): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: REFRESH_TOKEN_EXPIRATION_TIME,
  })
}

export const decodeToken = (token: string): iTOKEN_PAYLOAD => {
  return jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string
  ) as iTOKEN_PAYLOAD
}

export const decodeRefreshToken = (token: string): iTOKEN_PAYLOAD => {
  return jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET as string
  ) as iTOKEN_PAYLOAD
}
