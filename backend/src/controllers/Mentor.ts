import { encryptPassword } from '../helpers/Auth'
import AuthModal from '../models/Auth'
import { catchAsync } from '../utils/catchAsync'
import { generatePass } from '../utils/generatePassword'
import {
  mongooseIdValidator,
  validateRequiredFeilds,
} from '../utils/validateFeilds'
import { Request, Response } from 'express'

import { paginate } from '../utils/pagination'
import { sendMail } from '../utils/mailService'
import { sendPushToUser } from '../utils/pushService'

export const createMentor = catchAsync(async (req: Request, res: Response) => {
  const requiredFields = ['email', 'name', 'phone', 'place', 'message']
  const validationError = validateRequiredFeilds(req.body, requiredFields)

  if (validationError) {
    return res.status(400).json({ message: validationError })
  }
  const email = String(req.body.email).toLowerCase().trim()
  const { phone } = req.body

  const mentorData = {
    ...req.body,
    email,
    role: 'TUTOR',
    password: await generatePass(),
    admin_approve: false,
  }

  const isExist = await AuthModal.findOne({
    $or: [{ email }, { phoneNumber: phone }],
  })

  if (isExist) {
    return res.status(400).json({
      message:
        'User already exists with this email or phone number please contact admin',
    })
  }
  const newMentor = await new AuthModal(mentorData).save()

  return res.status(201).json({
    message: 'Form Submitted Successfully',
  })
})

export const getMentors = catchAsync(async (req: Request, res: Response) => {
  const { type, id } = req.query
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  // If ID is passed, fetch and return that specific mentor
  if (id) {
    const mentor = await AuthModal.findOne(
      { _id: id, role: 'TUTOR' },
      {
        password: 0,
        emailVerified: 0,
        admin_approve: 0,
      }
    ).populate({
      path: 'selected_class.class_id', // populate class_id
      select: ['class','syllabus'], // only return class name (or any other fields you need)
    })
    .populate({
      path: 'selected_class.subject.subject_id', // populate nested subject_id
      select: 'name', // only return subject name
    })

    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found', data: null })
    }

    return res.status(200).json({
      message: 'Mentor details fetched successfully',
      data: mentor,
    })
  }

  // Otherwise, return paginated mentors
  // const mentors = await paginate(
  //   AuthModal,
  //   { role: 'TUTOR', admin_approve: type === 'approve' ? true : false },
  //   page,
  //   limit,
  //   undefined,
  //   {
  //     password: 0,
  //     emailVerified: 0,
  //     admin_approve: 0,
  //   }
  // );

  const mentors = await AuthModal.find(
    { role: 'TUTOR', admin_approve: type === 'approve' ? true : false },
    {
      password: 0,
      emailVerified: 0,
      admin_approve: 0,
    }
  )
    .populate({
      path: 'selected_class.class_id', // populate class_id
      select: 'class', // only return class name (or any other fields you need)
    })
    .populate({
      path: 'selected_class.subject.subject_id', // populate nested subject_id
      select: 'name', // only return subject name
    })
    .skip((page - 1) * limit)
    .limit(limit)

  if (!mentors) {
    return res.status(400).json({ message: 'No mentors requested', data: [] })
  }

  return res.status(200).json({
    message: `${
      type === 'approve' ? 'Approved' : 'Unapproved'
    } mentor details fetched successfully`,
    data: mentors,
  })
})

/**
 * DELETE /api/mentor/:id
 * Admin — permanently remove a mentor account (pending application OR approved
 * mentor). Past bookings/reviews keep their records; their mentor reference
 * simply stops resolving.
 */
export const deleteMentor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  if (!mongooseIdValidator(id)) {
    return res.status(400).json({ message: 'Invalid Id' })
  }

  // Scoped to TUTOR so this endpoint can never delete an admin/student.
  const deleted = await AuthModal.findOneAndDelete({ _id: id, role: 'TUTOR' })
  if (!deleted) {
    return res.status(404).json({ message: 'Mentor not found' })
  }

  return res.status(200).json({ message: 'Mentor removed successfully' })
})

/**
 * PUT /api/mentor/:id/availability  body: { available_slot?, is_available? }
 * Mentor/Admin — update ONLY availability. Dedicated (not `updateMentor`) so a
 * partial payload can't wipe selected_class / additional_details.
 */
export const updateMentorAvailability = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongooseIdValidator(id)) {
      return res.status(400).json({ message: 'Invalid Id' })
    }

    const update: Record<string, any> = {}
    if (Array.isArray(req.body.available_slot)) {
      update.available_slot = req.body.available_slot
    }
    if (typeof req.body.is_available === 'boolean') {
      update.is_available = req.body.is_available
    }
    if (Object.keys(update).length === 0) {
      return res
        .status(400)
        .json({ message: 'Provide available_slot and/or is_available' })
    }

    const updated = await AuthModal.findOneAndUpdate(
      { _id: id, role: 'TUTOR' },
      { $set: update },
      { new: true }
    ).select('available_slot is_available')

    if (!updated) {
      return res.status(404).json({ message: 'Mentor not found' })
    }

    return res
      .status(200)
      .json({ message: 'Availability updated successfully', data: updated })
  }
)

export const updateMentor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { admin_approve } = req.body;

  // ✅ Validate MongoDB ID
  if (!mongooseIdValidator(id)) {
    return res.status(400).json({ message: "Invalid Id" });
  }

  // ✅ Initialize payload
  const payload: Record<string, any> = {};

  // On approval we return the generated credentials to the (admin) caller so
  // they can be shared manually when email is unavailable/failed.
  let approvedCredentials: { email: string; password: string } | null = null;
  let emailSent = false;
  let emailError: string | null = null;

  // ✅ Handle admin approval logic
  if (admin_approve) {
    // req.user is set by the requireAuth middleware, which decodes the token
    // safely. A missing/expired/invalid token leaves it unset → return 401 so
    // the client silently refreshes and retries, instead of a hard 400 that
    // strands the admin (the old manual decodeToken threw "invalid signature").
    const authedUser = (req as { user?: { _id?: string; role?: string } }).user;

    if (!authedUser?._id) {
      return res.status(401).json({ message: "Session expired. Please try again." });
    }
    if (authedUser.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "You do not have permission to approve mentors" });
    }

    const user = await AuthModal.findOne({ _id: id, role: "TUTOR" });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const pass = await generatePass();

    // ✅ Try sending email — but continue even if it fails
    try {
      await sendMail(user.email, "Your Login credentials", "user", {
        email: user.email,
        pass: pass,
      });
      emailSent = true;
    } catch (err: any) {
      emailError = err?.message ?? "unknown error";
      console.error("❌ Failed to send email:", emailError);
      // Continue anyway — the admin gets the credentials in the response.
    }

    approvedCredentials = { email: user.email, password: pass };

    // ✅ Set payload regardless of email success/failure
    payload.admin_approve = true;
    payload.is_first_login = true;
    payload.password = await encryptPassword(pass);
  }

  // ✅ Always update mentor info (even if email fails)
  const updatedUser = await AuthModal.findByIdAndUpdate(
    id,
    {
      $set: {
        ...req.body,
        ...payload,
        additional_details: req.body.additional_details,
        available_slot: req.body.available_slot,
        selected_class: req.body.selected_class,
      },
    },
    { new: true }
  );

  // Tell the mentor (on their device, if signed in) they've been approved.
  if (admin_approve) {
    sendPushToUser(id, {
      title: "You're approved! 🎉",
      body: 'Your mentor account is active. Set up your profile to start teaching.',
      data: { type: 'mentor_approved' },
    }).catch(err => console.error('[push] mentor approve notify failed:', err.message))
  }

  return res.status(200).json({
    message: "User Details Updated Successfully",
    data: updatedUser,
    // Present only on approval: lets the admin share credentials manually
    // (e.g. WhatsApp) when email is not configured or delivery failed.
    ...(approvedCredentials
      ? { credentials: approvedCredentials, emailSent, emailError }
      : {}),
  });
});

/**
 * POST /api/mentor/:id/resend-credentials
 * Admin — regenerate a mentor's password and (try to) email it again. Always
 * returns the new credentials so the admin can share them manually if email
 * is down. Use when a mentor lost their password or the email never arrived.
 */
export const resendMentorCredentials = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    if (!mongooseIdValidator(id)) {
      return res.status(400).json({ message: 'Invalid Id' })
    }

    const authedUser = (req as { user?: { _id?: string; role?: string } }).user
    if (!authedUser?._id) {
      return res.status(401).json({ message: 'Session expired. Please try again.' })
    }
    if (authedUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You do not have permission' })
    }

    const mentor = await AuthModal.findOne({ _id: id, role: 'TUTOR' })
    if (!mentor) {
      return res.status(404).json({ message: 'Mentor not found' })
    }

    const pass = await generatePass()
    mentor.password = await encryptPassword(pass)
    mentor.is_first_login = true
    await mentor.save()

    let emailSent = false
    let emailError: string | null = null
    try {
      await sendMail(mentor.email, 'Your Login credentials', 'user', {
        email: mentor.email,
        pass,
      })
      emailSent = true
    } catch (err: any) {
      emailError = err?.message ?? 'unknown error'
      console.error('❌ Failed to resend credentials email:', emailError)
    }

    return res.status(200).json({
      message: 'Credentials regenerated',
      credentials: { email: mentor.email, password: pass },
      emailSent,
      emailError,
    })
  }
)
