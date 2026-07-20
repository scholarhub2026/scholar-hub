import Auth from '../models/Auth'
import ClassesModel from '../models/Classes'
import SubjectModel from '../models/Subject'
import {
  BillableBookingType,
  PricingError,
  RateCard,
  estimateBaseAmount,
  resolveRateCard,
} from './pricingEngine'

export type ResolvedRates = {
  rateCard: RateCard
  /** Advisory display amount (per class for 'full', summed ₹/hr otherwise). */
  estimatedAmount: number
  /** 'per class' | 'per hour' — how estimatedAmount should be labelled. */
  estimateUnit: 'per class' | 'per hour'
}

/**
 * Load the mentor + catalog docs and resolve the rate card for a booking
 * request (SRD custom-fee override: tutor rates when custom_fee_enabled,
 * global catalog fees otherwise). Throws PricingError with a user-readable
 * message when fees aren't configured.
 */
export const resolveRatesForBooking = async (input: {
  mentorId: string
  classId: string
  bookingType: BillableBookingType
  selectedSubjectIds: string[]
}): Promise<ResolvedRates> => {
  const { mentorId, classId, bookingType, selectedSubjectIds } = input

  const [mentor, catalogClass] = await Promise.all([
    Auth.findOne({ _id: mentorId, role: 'TUTOR' })
      .select('custom_fee_enabled selected_class')
      .lean(),
    ClassesModel.findById(classId).lean(),
  ])
  if (!mentor) throw new PricingError('MISSING_RATE_CARD', 'Mentor not found')
  if (!catalogClass) {
    throw new PricingError('MISSING_RATE_CARD', 'Class not found in catalog')
  }

  const mentorSelectedClass = (mentor.selected_class ?? []).find(
    (sc: any) => String(sc.class_id?._id ?? sc.class_id) === String(classId)
  ) as unknown as
    | { price: number; subject: { subject_id: any; subject_price: number }[] }
    | undefined

  // Display names for line items / receipts (best-effort).
  const subjectNames: Record<string, string> = {}
  if (selectedSubjectIds.length) {
    const subjects = await SubjectModel.find({
      _id: { $in: selectedSubjectIds },
    })
      .select('name')
      .lean()
    for (const s of subjects) subjectNames[String(s._id)] = s.name
  }

  const rateCard = resolveRateCard({
    bookingType,
    customFeeEnabled: Boolean(mentor.custom_fee_enabled),
    mentorSelectedClass: mentorSelectedClass
      ? {
          price: mentorSelectedClass.price,
          subject: (mentorSelectedClass.subject ?? []).map((s: any) => ({
            subject_id: String(s.subject_id?._id ?? s.subject_id),
            subject_price: s.subject_price,
          })),
        }
      : null,
    catalogClass: {
      basePrice: catalogClass.basePrice,
      subjects: (catalogClass.subjects ?? []).map((s: any) => ({
        subjectId: String(s.subjectId?._id ?? s.subjectId),
        price: s.price,
      })),
    },
    selectedSubjectIds: selectedSubjectIds.map(String),
    subjectNames,
  })

  return {
    rateCard,
    estimatedAmount: estimateBaseAmount(bookingType, rateCard),
    estimateUnit: bookingType === 'full' ? 'per class' : 'per hour',
  }
}
