import { Request, Response } from 'express'

import { catchAsync } from '../utils/catchAsync'
import { validateRequiredFeilds, mongooseIdValidator } from '../utils/validateFeilds'
import Auth from '../models/Auth'
import { encryptPassword } from '../helpers/Auth'
import { generateReferralCode } from '../utils/referral'
import { AUTH_CONSTANTS } from '../constants/Auth'

const ROLES = Object.values(AUTH_CONSTANTS.ROLES)

/**
 * GET /api/users?page=&limit=&role=&search=
 * Admin — paginated list of all accounts with optional role filter + search.
 */
export const getUsersController = catchAsync(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const { role, search } = req.query

    const filter: Record<string, unknown> = {}
    if (role && ROLES.includes(String(role))) filter.role = role
    if (search) {
      const rx = new RegExp(String(search), 'i')
      filter.$or = [
        { firstName: rx },
        { lastName: rx },
        { email: rx },
        { phoneNumber: rx },
      ]
    }

    const skip = (page - 1) * limit
    const projection = {
      firstName: 1,
      lastName: 1,
      email: 1,
      phoneNumber: 1,
      role: 1,
      isActive: 1,
      emailVerified: 1,
      completed_profile: 1,
      createdAt: 1,
    }

    const [data, total] = await Promise.all([
      Auth.find(filter, projection).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Auth.countDocuments(filter),
    ])

    return res.status(200).json({
      message: 'Users retrieved successfully',
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  }
)

/**
 * POST /api/users  body: { email, firstName, lastName, role, password, phoneNumber? }
 * Admin — create an account with an explicit role (the only way to make an
 * ADMIN, since public signup is always STUDENT). Pre-verified.
 */
export const createUserController = catchAsync(
  async (req: Request, res: Response) => {
    const error = validateRequiredFeilds(req.body, [
      'email',
      'firstName',
      'lastName',
      'role',
      'password',
    ])
    if (error) return res.status(400).json({ message: error })

    const { email, firstName, lastName, phoneNumber, role, password } = req.body

    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters long.' })
    }

    const existing = await Auth.findOne({ email })
    if (existing) {
      return res.status(409).json({ message: 'The email address is already in use.' })
    }

    const referralCode = await generateReferralCode()
    const user = await Auth.create({
      email,
      firstName,
      lastName,
      phoneNumber,
      role,
      password: await encryptPassword(password),
      emailVerified: true, // admin-created accounts are pre-verified
      completed_profile: role !== AUTH_CONSTANTS.ROLES.TUTOR,
      referralCode,
    })

    return res.status(201).json({
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    })
  }
)

/**
 * PUT /api/users/:id/status  body: { isActive: boolean }
 * Admin — enable/disable an account. Disabled users can't log in.
 */
export const setUserStatusController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongooseIdValidator(id)) {
      return res.status(400).json({ message: 'Invalid user id' })
    }

    const { isActive } = req.body || {}
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive (boolean) is required' })
    }

    const user = await Auth.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('firstName lastName email role isActive')

    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    })
  }
)
