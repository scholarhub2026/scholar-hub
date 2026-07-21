import { Request, Response } from 'express'

import Auth from '../models/Auth'
import Enquiry from '../models/Enquiry'
import { catchAsync } from '../utils/catchAsync'
import { sendMail } from '../utils/mailService'
import { sendPushToRole } from '../utils/pushService'
import {
  mongooseIdValidator,
  validateRequiredFeilds,
} from '../utils/validateFeilds'

const money = (n: number): string =>
  n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Free'

/**
 * POST /api/enquiry  (public — lead form)
 * A student's class enquiry against a mentor. Saves the record and emails +
 * pushes all admins so they can contact the parties and create the booking.
 */
export const createEnquiryController = catchAsync(
  async (req: Request, res: Response) => {
    const validation = await validateRequiredFeilds(req.body, [
      'studentName',
      'email',
      'phone',
      'mentorId',
      'enquiryType',
    ])
    if (validation) {
      return res.status(400).json({
        message: 'Please provide all required fields',
        error: validation,
      })
    }
    if (!mongooseIdValidator(req.body.mentorId)) {
      return res.status(400).json({ message: 'Valid mentorId is required' })
    }
    if (!['demo', 'subject-wise'].includes(req.body.enquiryType)) {
      return res
        .status(400)
        .json({ message: 'enquiryType must be demo or subject-wise' })
    }

    const mentor = await Auth.findOne({
      _id: req.body.mentorId,
      role: 'TUTOR',
    }).select('firstName lastName')
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' })
    }
    const mentorName =
      `${mentor.firstName ?? ''} ${mentor.lastName ?? ''}`.trim() || 'the mentor'

    const subjects = Array.isArray(req.body.subjects)
      ? req.body.subjects.map((s: any) => ({
          subjectId: mongooseIdValidator(s?.subjectId) ? s.subjectId : null,
          name: String(s?.name ?? ''),
          price: Number(s?.price) || 0,
        }))
      : []
    // Demo is always free; subject-wise sums the picked subjects.
    const estimatedAmount =
      req.body.enquiryType === 'demo'
        ? 0
        : subjects.reduce((sum: number, s: any) => sum + (s.price || 0), 0)

    const enquiry = await Enquiry.create({
      studentName: String(req.body.studentName).trim(),
      email: String(req.body.email).toLowerCase().trim(),
      phone: String(req.body.phone).trim(),
      mentorId: req.body.mentorId,
      mentorName,
      selectedSyllabus: String(req.body.selectedSyllabus ?? ''),
      classId: mongooseIdValidator(req.body.classId) ? req.body.classId : null,
      className: String(req.body.className ?? ''),
      enquiryType: req.body.enquiryType,
      subjects,
      estimatedAmount,
      message: String(req.body.message ?? '').trim(),
      status: 'new',
    })

    // Notify all admins (email + push) — best-effort, never fail the enquiry.
    // Await the lookup + fire the sends (not awaited individually) before
    // responding so nothing is dropped.
    const admins = await Auth.find({ role: 'ADMIN' })
      .select('email')
      .catch(() => [])
    for (const admin of admins) {
      if (!admin.email) continue
      sendMail(
        admin.email,
        `New class enquiry — ${enquiry.studentName}`,
        'classEnquiry',
        {
          studentName: enquiry.studentName,
          phone: enquiry.phone,
          email: enquiry.email,
          mentorName,
          enquiryType:
            enquiry.enquiryType === 'demo' ? 'Demo class' : 'Subject-wise',
          className: enquiry.className ?? '',
          subjects: subjects.length
            ? subjects.map((s: any) => s.name).filter(Boolean).join(', ')
            : '—',
          amount: money(estimatedAmount),
          message: enquiry.message || undefined,
        }
      ).catch((err) => console.error('[mail] enquiry admin failed:', err.message))
    }

    sendPushToRole('ADMIN', {
      title: 'New class enquiry',
      body: `${enquiry.studentName} enquired about classes with ${mentorName}.`,
      data: { type: 'enquiry', enquiryId: enquiry._id.toString() },
    }).catch((err) => console.error('[push] enquiry notify failed:', err.message))

    return res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry,
    })
  }
)

/**
 * GET /api/enquiry  (ADMIN)
 * Query: scope=all|new|contacted|converted|closed (default all), search, page, limit.
 * Returns counts for the status tabs.
 */
export const getEnquiriesController = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10)
    )
    const scope = String(req.query.scope ?? 'all')
    const search = String(req.query.search ?? '').trim()

    const base: Record<string, any> = {}
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      base.$or = [
        { studentName: rx },
        { email: rx },
        { phone: rx },
        { mentorName: rx },
      ]
    }

    const scoped = { ...base }
    if (['new', 'contacted', 'converted', 'closed'].includes(scope)) {
      scoped.status = scope
    }

    const [enquiries, total, newCount, contactedCount, convertedCount, closedCount] =
      await Promise.all([
        Enquiry.find(scoped)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Enquiry.countDocuments(scoped),
        Enquiry.countDocuments({ ...base, status: 'new' }),
        Enquiry.countDocuments({ ...base, status: 'contacted' }),
        Enquiry.countDocuments({ ...base, status: 'converted' }),
        Enquiry.countDocuments({ ...base, status: 'closed' }),
      ])

    return res.status(200).json({
      message: 'Enquiries fetched successfully',
      enquiries,
      counts: {
        new: newCount,
        contacted: contactedCount,
        converted: convertedCount,
        closed: closedCount,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    })
  }
)

/**
 * PATCH /api/enquiry/:id  (ADMIN) — update status.
 */
export const updateEnquiryController = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongooseIdValidator(id)) {
      return res.status(400).json({ message: 'Invalid enquiry id' })
    }
    const status = String(req.body?.status ?? '')
    if (!['new', 'contacted', 'converted', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' })
    }
    return res.status(200).json({ message: 'Enquiry updated', enquiry })
  }
)
