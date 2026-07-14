import { Request, Response } from 'express'
import { catchAsync } from '../utils/catchAsync'
import { validateRequiredFeilds } from '../utils/validateFeilds'
import AuthModal from '../models/Auth'
import {
  comparePassword,
  decodeToken,
  decodeRefreshToken,
  encryptPassword,
  generateAccessToken,
  generateRefreshToken,
} from '../helpers/Auth'
import { iTOKEN_PAYLOAD } from '../types/Auth'
import { COOKIE_OPTIONS, REFRESH_COOKIE_NAME } from '../constants/Auth'
import { generateOTP, verifyOTP } from '../utils/generateOTP'

import { generatePass } from '../utils/generatePassword'
import Booking from '../models/Booking'
import { sendMail } from '../utils/mailService'
import { linkReferrer, generateReferralCode } from '../utils/referral'

export const signupController = catchAsync(async (req: Request, res: Response) => {
  // ✅ Step 1: Validate required fields
  const error = validateRequiredFeilds(req.body, [
    "email",
    "phoneNumber",
    "firstName",
    "lastName",
    "password",
  ]);

  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  // ✅ Step 2: Determine and validate role
  const { type } = req.params;
  

  const role =
    type === "admin" ? "ADMIN" : type === "tutor" ? "TUTOR" : "STUDENT";

  // ✅ Step 3: Extract fields (emails are case-insensitive — normalize)
  const { phoneNumber, password, firstName, lastName } = req.body;
  const email = String(req.body.email).toLowerCase().trim();

  // ✅ Step 4: Validate password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long.",
    });
  }

  // ✅ Step 5: Check for existing email or phone number
  const existingUser = await AuthModal.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return res.status(400).json({
        success: false,
        message: "The email address is already in use.",
      });
    }
    if (existingUser.phoneNumber === phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "The phone number is already in use.",
      });
    }
  }

  // ✅ Step 6: Generate OTP + this user's own referral code
  const { otp, otpExpiry } = generateOTP();
  const referralCode = await generateReferralCode();

  // ✅ Step 7: Create and save user
  const user = new AuthModal({
    firstName,
    lastName,
    email,
    phoneNumber,
    password: await encryptPassword(password),
    emailVerificationOTP: await encryptPassword(otp),
    otpExpiry,
    role:role||"STUDENT",
    referralCode,
  });

  const registerUser = await user.save();

  // ✅ Step 7b: Record who referred this user (payout happens on first booking)
  await linkReferrer(req.body.referralCode, registerUser._id.toString());

  // ✅ Step 8: Send OTP email (non-blocking)
  try {
    await sendMail(
      registerUser.email,
      "Your OTP Code from Scholar Hub",
      "user",
      {
        email: registerUser.email,
        pass:password,
      }
    );
  } catch (error: any) {
    console.error("❌ Error sending verification email:", error.message);
  }

  // ✅ Step 9: Generate JWT token
  const token = generateAccessToken({ _id: registerUser._id.toString() });

  console.log(token);
  

  // ✅ Step 10: Respond success
  return res.status(201).json({
    success: true,
    message: "Account created successfully. Please verify your email.",
    data: {
      userId: registerUser._id,
      role: registerUser.role,
      token,
    },
  });
});

export const signInController = catchAsync(
  async (req: Request, res: Response) => {
    const error = validateRequiredFeilds(req.body, ['email', 'password'])
    if (error) {
      res.status(400).json({ message: error })
    }

    const user = await AuthModal.findOne({
      email: String(req.body.email).toLowerCase().trim(),
    })

    if (!user) {
      return res.status(400).json({
        message: 'No user found for this email address...',
      })
    }

    const isMatch = await comparePassword(
      req.body.password,
      user.password || ''
    )

    if (!isMatch) {
      return res.status(400).json({
        message: 'Incorrect password',
      })
    }

    if (!user.isActive) {
      return res.status(400).json({
        message: 'Your account has been disabled. Contact the Administrator',
      })
    }

    const payload: iTOKEN_PAYLOAD = {
      _id: user.id,
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    if (!accessToken || !refreshToken) {
      throw new Error()
    }

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    return res.status(201).json({
      message: 'Login Successfully ',
      token: accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        completed_profile: user.completed_profile? user.completed_profile : false,
      },
    })
  }
)

export const refreshTokenController = catchAsync(
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).send('Unauthorized')

    const token = authHeader.split(' ')[1]
    try {
      const decoded = decodeToken(token)
      if (!decoded || typeof decoded !== 'object' || !decoded._id) {
        return res.status(401).json({ message: 'Invalid or expired token' })
      }

      const user = await AuthModal.findById(decoded._id)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      return res.status(200).json({ valid: true,  user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        completed_profile: user.completed_profile? user.completed_profile : false,
        is_first_login: user.is_first_login? user.is_first_login : false,
      }, })
    } catch (err) {
      res.status(401).send('Invalid or expired token')
    }
  }
)

/**
 * Read the refresh token from the httpOnly cookie (web) or, as a fallback, the
 * request body (native clients that store it themselves). No cookie-parser dep —
 * we parse the single cookie we care about from the header.
 */
const getRefreshToken = (req: Request): string | undefined => {
  const cookieHeader = req.headers.cookie
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`))
    if (match) return decodeURIComponent(match.slice(REFRESH_COOKIE_NAME.length + 1))
  }
  if (req.body?.refreshToken) return req.body.refreshToken as string
  return undefined
}

/**
 * POST /api/auth/refresh
 * Exchange a valid refresh token (httpOnly cookie) for a fresh access token,
 * rotating the refresh cookie. Public route — the access token is expired by the
 * time this is called; the cookie is the credential.
 */
export const refreshAccessTokenController = catchAsync(
  async (req: Request, res: Response) => {
    const token = getRefreshToken(req)
    if (!token) return res.status(401).json({ message: 'No refresh token provided' })

    let decoded: iTOKEN_PAYLOAD
    try {
      decoded = decodeRefreshToken(token)
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token' })
    }
    if (!decoded?._id) return res.status(401).json({ message: 'Invalid refresh token' })

    const user = await AuthModal.findById(decoded._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' })

    const payload: iTOKEN_PAYLOAD = { _id: user.id }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // Rotate the refresh cookie.
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, COOKIE_OPTIONS)

    return res.status(200).json({
      token: accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        completed_profile: user.completed_profile ? user.completed_profile : false,
        is_first_login: user.is_first_login ? user.is_first_login : false,
      },
    })
  }
)

export const updateUserController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params

    if (!req.body || Object.keys(req.body).length === 0)
      return res.status(401).json({ message: 'Nothing to update the feild' })


    if (req.body.is_available) {
  try {
    const updateStatus = await AuthModal.findByIdAndUpdate(
      id,
      { is_available: !req.body.is_available },
      { new: true }
    );

    if (!updateStatus) {
      return res.status(400).json({ message: "Failed to update" });
    }

    return res.status(202).json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
    const { email, phoneNumber, password, confirmPassword, emailVerified } =
      req.body || {}

    
      
    // Check if user ID is provided
    if (!id) {
      return res.status(400).json({ message: 'User ID not provided' })
    }
    if (emailVerified === true || emailVerified === false)
      return res
        .status(401)
        .json({ message: 'You do not have the permission to update ' })
    // Check if email or phone number already exists for another user

    if (email) {
      const duplicateUser = await AuthModal.findOne({
        _id: { $ne: id },
        $or: [
          email ? { email: email.toLowerCase() } : {},
          phoneNumber ? { phoneNumber } : {},
        ],
      })

      if (duplicateUser) {
        return res
          .status(409)
          .json({ message: 'The email or phone number already exists' })
      }
      const { otp, otpExpiry } = generateOTP()
      req.body.emailVerificationOTP = await encryptPassword(otp)
      req.body.otpExpiry = otpExpiry
      req.body.emailVerified = false
      await sendMail(
        email,
        'Your OTP code from Scholar hub',
        "otp",
        otp
      )
    }

    if (password) {
      if (!confirmPassword)
        return res.status(401).json({ message: 'Enter the confirmPassword' })
      if (password != confirmPassword)
        return res
          .status(401)
          .json({ message: 'Password and confirmPassword want to be same' })
      const securePass = await encryptPassword(password)
      req.body.password = securePass
    }

    // Proceed with updating the user
    const updatedUser = await AuthModal.findByIdAndUpdate(id, req.body, {
      new: true,
    })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res
      .status(200)
      .json({ message: 'User details updated successfully' })
  }
)

export const verifyEmailOTPController = catchAsync(
  async (req: Request, res: Response) => {
    const { otp } = req.body || {}
    const { id } = req.params

    if (!otp) return res.status(401).json({ message: 'Provide the otp' })
    if (!id) return res.status(401).json({ message: 'Provide the Id ' })

    const user = await AuthModal.findById(id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    if (user.emailVerified)
      return res.status(400).json({ message: 'Email already verified' })

    if (!(await verifyOTP(user.emailVerificationOTP, otp, user.otpExpiry)))
      return res
        .status(401)
        .json({ message: 'Invalid password or OTP expired' })

    user.emailVerified = true
    user.emailVerificationOTP = undefined
    user.otpExpiry = undefined
    await user.save()

    return res.status(201).json({ message: 'Email verifed successfully' })
  }
)

/**
 * PUT /api/auth/fcm-token/:id  body: { token }
 * Register a device's FCM token so the user can receive push notifications.
 */
export const registerFcmTokenController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { token } = req.body || {}

    if (!token) return res.status(400).json({ message: 'Provide the token' })

    const updated = await AuthModal.findByIdAndUpdate(
      id,
      { $addToSet: { fcmTokens: token } },
      { new: true }
    )
    if (!updated) return res.status(404).json({ message: 'User not found' })

    return res.status(200).json({ message: 'Device registered for notifications' })
  }
)

/**
 * DELETE /api/auth/fcm-token/:id  body: { token }
 * Remove a device token (e.g. on logout) so it stops receiving pushes.
 */
export const removeFcmTokenController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { token } = req.body || {}

    if (!token) return res.status(400).json({ message: 'Provide the token' })

    await AuthModal.findByIdAndUpdate(id, { $pull: { fcmTokens: token } })

    return res.status(200).json({ message: 'Device removed from notifications' })
  }
)


