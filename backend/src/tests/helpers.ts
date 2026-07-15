import jwt from 'jsonwebtoken' // → stub in tests
import Auth from '../models/Auth'
import Classes from '../models/Classes'
import Subject from '../models/Subject'
import { encryptPassword } from '../helpers/Auth'

let seq = 0
const uniq = () => `${Date.now()}_${seq++}`

/** Mint a valid access token (Bearer) for a given user id. */
export const tokenFor = (id: string): string =>
  jwt.sign({ _id: id }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: '1d',
  })

export const bearer = (id: string): string => `Bearer ${tokenFor(id)}`

type SeedOverrides = Record<string, any>

/** Create an Auth user (hashes the password). Returns {user, id, password, token}. */
export async function seedUser(overrides: SeedOverrides = {}) {
  const { password: pw, ...rest } = overrides
  const password = pw ?? 'Password123'
  const user = await Auth.create({
    email: `user_${uniq()}@test.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT',
    emailVerified: true,
    isActive: true,
    ...rest,
    password: await encryptPassword(password),
  })
  const id = String(user._id)
  return { user, id, password, token: bearer(id) }
}

export const seedAdmin = (o: SeedOverrides = {}) => seedUser({ role: 'ADMIN', ...o })
export const seedStudent = (o: SeedOverrides = {}) => seedUser({ role: 'STUDENT', ...o })
export const seedMentor = (o: SeedOverrides = {}) =>
  seedUser({ role: 'TUTOR', admin_approve: true, ...o })

/** Create a Subject doc. */
export async function seedSubject(name?: string, type: 'subject' | 'syllabus' = 'subject') {
  return Subject.create({ name: (name ?? `math_${uniq()}`).toLowerCase(), type })
}

/** Create a Class doc with one subject. */
export async function seedClass(overrides: SeedOverrides = {}) {
  const subject = overrides.subject ?? (await seedSubject())
  return Classes.create({
    class: overrides.class ?? `class_${uniq()}`,
    syllabus: overrides.syllabus ?? 'cbse',
    basePrice: overrides.basePrice ?? '500',
    subjects: [{ subjectId: subject._id, price: overrides.price ?? 500 }],
    sortOrder: overrides.sortOrder ?? seq,
    ...(overrides.raw ?? {}),
  })
}

/**
 * Build a valid booking payload for POST /api/booking. Ties the booking to a
 * mentor/class/subject so the duplicate guard has something to compare.
 */
export function bookingPayload(opts: {
  studentId: string
  mentorId: string
  classId?: string
  subjectId?: string
  bookingType?: 'full' | 'individual' | 'multiple'
  totalAmount?: number
  email?: string
}) {
  return {
    studentId: opts.studentId,
    mentorId: opts.mentorId,
    studentName: 'Test Student',
    sessionType: 'online',
    agreeToTerms: true,
    selectedSyllabus: 'cbse',
    bookingType: opts.bookingType ?? 'individual',
    totalAmount: opts.totalAmount ?? 500,
    email: opts.email ?? 'student@test.com',
    phone: '9999999999',
    selectedSubjects: opts.subjectId ? [opts.subjectId] : [],
    selectedClass: opts.classId
      ? {
          class_id: { _id: opts.classId, class: 'X', syllabus: 'cbse' },
          price: 500,
          subject: opts.subjectId
            ? [{ subject_id: { _id: opts.subjectId, name: 'math' }, subject_price: 500 }]
            : [],
        }
      : undefined,
  }
}
