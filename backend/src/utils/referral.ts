import crypto from 'crypto'
import Auth from '../models/Auth'

/**
 * Reward rule (configurable via env). The referrer earns REFERRAL_REWARD and the
 * referred user gets a REFERRAL_WELCOME bonus, both paid out ONCE when the
 * referred user completes their FIRST paid booking (abuse-resistant). Signup
 * only records who referred whom — see linkReferrer() and rewardReferralOnBooking().
 */
export const REFERRAL_REWARD = Number(process.env.REFERRAL_REWARD ?? 100)
export const REFERRAL_WELCOME = Number(process.env.REFERRAL_WELCOME ?? 50)

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I

const randomCode = (length = 6): string => {
  const bytes = crypto.randomBytes(length)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return code
}

/** Generate a referral code guaranteed unique against existing users. */
export const generateReferralCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `SH${randomCode()}`
    const existing = await Auth.exists({ referralCode: code })
    if (!existing) return code
  }
  // Extremely unlikely fallback — widen the random space.
  return `SH${randomCode(8)}`
}

/**
 * At signup: record which user referred the new one, if a valid code was given.
 * No rewards are paid here — that happens on the first completed booking.
 * Returns the referrer's _id if the code matched, otherwise null.
 */
export const linkReferrer = async (
  code: string | undefined,
  newUserId: string
): Promise<string | null> => {
  if (!code) return null

  const referrer = await Auth.findOne({ referralCode: code.trim() })
  if (!referrer || referrer._id.toString() === newUserId) return null

  await Auth.findByIdAndUpdate(newUserId, { referredBy: referrer._id })
  return referrer._id.toString()
}

/**
 * When a referred user's first paid booking completes, pay out the referrer
 * and the referred user's welcome bonus — exactly once. Idempotent: guarded by
 * the `referralRewarded` flag, so calling it repeatedly is safe.
 */
export const rewardReferralOnBooking = async (
  studentId: string | undefined
): Promise<void> => {
  if (!studentId) return

  const student = await Auth.findById(studentId).select(
    'referredBy referralRewarded'
  )
  if (!student || !student.referredBy || student.referralRewarded) return

  await Auth.findByIdAndUpdate(student.referredBy, {
    $inc: { referralCount: 1, rewardBalance: REFERRAL_REWARD },
  })
  await Auth.findByIdAndUpdate(studentId, {
    referralRewarded: true,
    $inc: { rewardBalance: REFERRAL_WELCOME },
  })
}
