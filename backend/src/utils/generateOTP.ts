import { authenticator } from 'otplib'
import bcrypt from 'bcryptjs'

export const generateOTP = () => {
  const secret = authenticator.generateSecret()
  const otp = authenticator.generate(secret)
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

  return {
    otp,
    otpExpiry,
  }
}

export const verifyOTP = async (
  hashedOtp: string,
  otp: string,
  expiry: Date
) => {
  const isValid = await bcrypt.compare(otp, hashedOtp)

  if (!isValid || new Date() > expiry) {
    return false
  }
  return true
}
