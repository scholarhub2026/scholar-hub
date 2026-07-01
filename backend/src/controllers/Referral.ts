import { Request, Response } from 'express'

import { catchAsync } from '../utils/catchAsync'
import { mongooseIdValidator } from '../utils/validateFeilds'
import Auth from '../models/Auth'
import { generateReferralCode } from '../utils/referral'

/**
 * GET /api/referral/:id
 * Returns the user's own referral code (generated on demand for accounts that
 * predate the feature), how many people they've referred, their reward
 * balance, and the list of users who signed up with their code.
 */
export const getReferralController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params

    if (!mongooseIdValidator(id)) {
      return res.status(400).json({ message: 'Invalid user id' })
    }

    const user = await Auth.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Backfill a code for accounts created before refer & earn existed.
    if (!user.referralCode) {
      user.referralCode = await generateReferralCode()
      await user.save()
    }

    const referredUsers = await Auth.find({ referredBy: user._id })
      .select('firstName lastName email createdAt')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      message: 'Referral details retrieved successfully',
      data: {
        referralCode: user.referralCode,
        referralCount: user.referralCount ?? referredUsers.length,
        rewardBalance: user.rewardBalance ?? 0,
        referredUsers,
      },
    })
  }
)
